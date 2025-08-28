"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMovementCreate = exports.generateWZPZ = exports.createUserWithRole = exports.setUserClaims = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Keep require style; @types/pdfkit will supply types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");
const storage_1 = require("firebase-admin/storage");
try {
    admin.app();
}
catch {
    admin.initializeApp();
}
/**
 * Set custom claims for a user (admin only)
 */
exports.setUserClaims = functions.region('us-central1').https.onCall(async (data, ctx) => {
    if (!ctx.auth)
        throw new functions.https.HttpsError('unauthenticated', '');
    const caller = await admin.auth().getUser(ctx.auth.uid);
    if (caller.customClaims?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', '');
    }
    const { uid, role, clientId } = data;
    if (!uid || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'uid and role required');
    }
    await admin.auth().setCustomUserClaims(uid, { role, clientId: clientId ?? null });
    await admin.firestore().collection('users').doc(uid).set({ role, clientId: clientId ?? null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true };
});
/**
 * Create user with role (admin only) - atomic operation
 */
exports.createUserWithRole = functions.region('us-central1').https.onCall(async (data, ctx) => {
    if (!ctx.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    const caller = await admin.auth().getUser(ctx.auth.uid);
    if (caller.customClaims?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin only');
    }
    const { email, password, displayName, role, clientId } = data;
    if (!email || !password || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'email, password, role required');
    }
    // 1) Create Auth user
    const user = await admin.auth().createUser({ email, password, displayName });
    // 2) Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role, clientId: clientId ?? null });
    // 3) Create Firestore user doc
    await admin.firestore().collection('users').doc(user.uid).set({
        email,
        displayName: displayName ?? '',
        role,
        clientId: clientId ?? null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, uid: user.uid };
});
/**
 * Allocate WZPZ sequence number for client/month
 */
async function allocateWZPZSequence(clientId, year, month) {
    const yyyymm = `${year}${String(month).padStart(2, '0')}`;
    const ref = admin.firestore().doc(`counters/${clientId}/months/${yyyymm}`);
    const { seq } = await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const cur = (snap.exists ? snap.data().seq : 0) + 1;
        tx.set(ref, { seq: cur }, { merge: true });
        return { seq: cur };
    });
    return seq;
}
/**
 * Generate WZPZ PDF document
 */
exports.generateWZPZ = functions.region('us-central1').https.onCall(async (data, ctx) => {
    if (!ctx.auth)
        throw new functions.https.HttpsError('unauthenticated', '');
    const { bladeId, type, clientId, code2, movementId, serviceOps } = data;
    if (!['WZ', 'PZ'].includes(type)) {
        throw new functions.https.HttpsError('invalid-argument', 'type must be WZ|PZ');
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const seq = await allocateWZPZSequence(clientId, year, month);
    const humanId = `${type}/${code2}/${year}/${String(month).padStart(2, '0')}/${String(seq).padStart(3, '0')}`;
    // Build PDF
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise((res) => doc.on('end', () => res(Buffer.concat(chunks))));
    // PDF Content
    doc.fontSize(20).text('iPM — Dokument WZPZ', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).text(`Numer dokumentu: ${humanId}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.text(`Typ dokumentu: ${type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}`);
    doc.text(`Data: ${now.toLocaleDateString('pl-PL')}`);
    doc.text(`Godzina: ${now.toLocaleTimeString('pl-PL')}`);
    doc.moveDown(1);
    doc.text(`Piła (ID): ${bladeId}`);
    doc.text(`Klient: ${code2}`);
    if (movementId) {
        doc.text(`Ruch: ${movementId}`);
    }
    // Add service operations if present
    if (serviceOps && serviceOps.length) {
        doc.moveDown(1);
        doc.fontSize(12).text('Operacje serwisowe wykonane:', { underline: true });
        serviceOps.forEach((op) => {
            doc.text(`• ${op}`);
        });
    }
    doc.moveDown(2);
    // Signature section
    doc.text('Podpisy:', { underline: true });
    doc.moveDown(1);
    doc.text('Podpis klienta: ___________________________');
    doc.moveDown(1);
    doc.text('Podpis iPM: ___________________________');
    doc.moveDown(2);
    // Footer
    doc.fontSize(10).text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, { align: 'right' });
    doc.end();
    const pdf = await done;
    const fileName = `${type}-${String(seq).padStart(3, '0')}_${bladeId}.pdf`;
    const path = `wzpz/${year}/${String(month).padStart(2, '0')}/${code2}/${fileName}`;
    const bucket = (0, storage_1.getStorage)().bucket();
    const file = bucket.file(path);
    await file.save(pdf, { contentType: 'application/pdf' });
    // Write metadata to Firestore
    await admin.firestore().collection('wzpz').add({
        bladeId,
        clientId,
        clientCode2: code2,
        type,
        seq,
        year,
        month,
        humanId,
        storagePath: path,
        byUserId: ctx.auth.uid,
        movementId: movementId || null,
        serviceOps: serviceOps || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, humanId, storagePath: path };
});
/**
 * Internal helper for WZPZ generation (used by trigger)
 */
async function generateWZPZInternal(data, byUserId) {
    const { bladeId, type, clientId, code2, movementId, serviceOps } = data;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const seq = await allocateWZPZSequence(clientId, year, month);
    const humanId = `${type}/${code2}/${year}/${String(month).padStart(2, '0')}/${String(seq).padStart(3, '0')}`;
    // Build PDF
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise((res) => doc.on('end', () => res(Buffer.concat(chunks))));
    // PDF Content
    doc.fontSize(20).text('iPM — Dokument WZPZ', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).text(`Numer dokumentu: ${humanId}`, { align: 'left' });
    doc.moveDown(0.5);
    doc.text(`Typ dokumentu: ${type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}`);
    doc.text(`Data: ${now.toLocaleDateString('pl-PL')}`);
    doc.text(`Godzina: ${now.toLocaleTimeString('pl-PL')}`);
    doc.moveDown(1);
    doc.text(`Piła (ID): ${bladeId}`);
    doc.text(`Klient: ${code2}`);
    if (movementId) {
        doc.text(`Ruch: ${movementId}`);
    }
    // Add service operations if present
    if (serviceOps && serviceOps.length) {
        doc.moveDown(1);
        doc.fontSize(12).text('Operacje serwisowe wykonane:', { underline: true });
        serviceOps.forEach((op) => {
            doc.text(`• ${op}`);
        });
    }
    doc.moveDown(2);
    // Signature section
    doc.text('Podpisy:', { underline: true });
    doc.moveDown(1);
    doc.text('Podpis klienta: ___________________________');
    doc.moveDown(1);
    doc.text('Podpis iPM: ___________________________');
    doc.moveDown(2);
    // Footer
    doc.fontSize(10).text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, { align: 'right' });
    doc.end();
    const pdf = await done;
    const fileName = `${type}-${String(seq).padStart(3, '0')}_${bladeId}.pdf`;
    const path = `wzpz/${year}/${String(month).padStart(2, '0')}/${code2}/${fileName}`;
    const bucket = (0, storage_1.getStorage)().bucket();
    const file = bucket.file(path);
    await file.save(pdf, { contentType: 'application/pdf' });
    // Write metadata to Firestore
    await admin.firestore().collection('wzpz').add({
        bladeId,
        clientId,
        clientCode2: code2,
        type,
        seq,
        year,
        month,
        humanId,
        storagePath: path,
        byUserId,
        movementId: movementId || null,
        serviceOps: serviceOps || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { ok: true, humanId, storagePath: path };
}
/**
 * Trigger on movement create - auto-generate WZPZ for WZ/PZ operations
 */
exports.onMovementCreate = functions.firestore
    .document('movements/{id}')
    .onCreate(async (snap, ctx) => {
    const movement = snap.data();
    if (movement.opCode === 'WZ' || movement.opCode === 'PZ') {
        try {
            const client = await admin.firestore().doc(`clients/${movement.clientId}`).get();
            const code2 = client.data()?.code2 || 'XX';
            await generateWZPZInternal({
                bladeId: movement.bladeId,
                type: movement.opCode,
                clientId: movement.clientId,
                code2,
                movementId: snap.id,
                serviceOps: movement.meta?.serviceOps || []
            }, movement.byUserId);
            console.log(`Generated WZPZ for movement ${snap.id}, blade ${movement.bladeId}`);
        }
        catch (error) {
            console.error('Error generating WZPZ:', error);
        }
    }
});
