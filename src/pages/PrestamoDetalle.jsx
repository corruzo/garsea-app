import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { loanService } from '../services/loanService';
import { paymentService } from '../services/paymentService';
import { storageService } from '../services/storageService';
import { useRateStore } from '../stores/rateStore';
import { useNotificationStore } from '../stores/notificationStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import {
    ArrowLeftIcon,
    BanknotesIcon,
    CalendarIcon,
    UserIcon,
    ArrowPathIcon,
    CheckBadgeIcon,
    PlusIcon,
    ReceiptPercentIcon,
    ClockIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    LockClosedIcon,
    PhotoIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/* ─── Helpers ───────────────────────────────────────────────── */
const fmt = (n, dec = 2) => Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-VE') : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const SYM = (m) => m === 'VES' ? 'Bs' : '$';

/* ─── PDF Generator ─────────────────────────────────────────── */
function generateContractPDF(prestamo, pagos, organizacion) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const sym = SYM(prestamo.moneda);
    const progress = ((prestamo.total_a_pagar - prestamo.saldo_pendiente) / prestamo.total_a_pagar) * 100;

    // Header band
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, W, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(organizacion?.nombre || 'GARSEA', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Préstamos', 14, 22);
    doc.text(`Contrato #${prestamo.id.split('-')[0].toUpperCase()}`, 14, 29);
    doc.text(`Emitido: ${fmtDate(new Date())}`, W - 14, 29, { align: 'right' });

    // Status badge
    const estadoColor = prestamo.estado === 'pagado' ? [16, 185, 129] : [239, 68, 68];
    doc.setFillColor(...estadoColor);
    doc.roundedRect(W - 42, 6, 28, 9, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(prestamo.estado.toUpperCase(), W - 28, 12.5, { align: 'center' });

    // Section: Partes del Contrato
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTES DEL CONTRATO', 14, 52);
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(14, 54, W - 14, 54);

    const partes = [
        ['Prestamista', organizacion?.nombre || ''],
        ['Prestatario', prestamo.clientes?.nombre || ''],
        ['C.I. Prestatario', `V-${prestamo.cliente_cedula}`],
        ['Teléfono', prestamo.clientes?.telefono || 'N/A'],
        ['Email', prestamo.clientes?.email || 'N/A'],
    ];
    doc.autoTable({
        startY: 57,
        head: [],
        body: partes,
        theme: 'plain',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: 14, right: 14 },
    });

    // Section: Condiciones Financieras
    const afterPartes = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('CONDICIONES FINANCIERAS', 14, afterPartes);
    doc.line(14, afterPartes + 2, W - 14, afterPartes + 2);

    const condiciones = [
        ['Monto del Capital', `${sym} ${fmt(prestamo.monto_capital)}`],
        ['Tasa de Interés', `${prestamo.porcentaje_interes}%`],
        ['Total a Pagar', `${sym} ${fmt(prestamo.total_a_pagar)}`],
        ['Moneda', prestamo.moneda],
        ['Tipo de Pago', prestamo.tipo_pago.toUpperCase()],
        ['Fecha de Inicio', fmtDate(prestamo.fecha_inicio)],
        ['Fecha de Vencimiento', fmtDate(prestamo.fecha_fin)],
        ['Estado Actual', prestamo.estado.toUpperCase()],
        ['Saldo Pendiente', `${sym} ${fmt(prestamo.saldo_pendiente)}`],
        ['Avance de Pago', `${fmt(progress, 1)}%`],
    ];
    doc.autoTable({
        startY: afterPartes + 5,
        head: [],
        body: condiciones,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 80 }
        },
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: 14, right: 14 },
    });

    // Section: Garantía
    if (prestamo.tiene_garantia) {
        const afterCond = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('GARANTÍA', 14, afterCond);
        doc.line(14, afterCond + 2, W - 14, afterCond + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(prestamo.descripcion_garantia || 'Sin descripción adicional.', 14, afterCond + 8, { maxWidth: W - 28 });
    }

    // Section: Historial de Pagos
    if (pagos.length > 0) {
        doc.addPage();
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, W, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('HISTORIAL DE PAGOS', 14, 13);
        doc.text(`Contrato #${prestamo.id.split('-')[0].toUpperCase()}`, W - 14, 13, { align: 'right' });

        doc.autoTable({
            startY: 28,
            head: [['#', 'Fecha', 'Método', 'Moneda', 'Abono', 'Saldo Resultante', 'Notas']],
            body: pagos.map((p, i) => [
                pagos.length - i,
                fmtDateTime(p.fecha_pago),
                p.metodo_pago.toUpperCase(),
                p.moneda_pago,
                `${SYM(p.moneda_pago)} ${fmt(p.monto_abonado)}`,
                `${sym} ${fmt(p.saldo_nuevo)}`,
                p.notas || '—',
            ]),
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            styles: { fontSize: 8.5, cellPadding: 2.5 },
            alternateRowStyles: { fillColor: [245, 247, 255] },
            margin: { left: 14, right: 14 },
        });
    }

    // Footer on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(150);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${organizacion?.nombre || 'GARSEA'} • Sistema de Gestión de Préstamos`, 14, 290);
        doc.text(`Página ${i} de ${pageCount}`, W - 14, 290, { align: 'right' });
    }

    doc.save(`Contrato_${prestamo.clientes?.nombre?.replace(/\s/g, '_')}_${prestamo.id.split('-')[0].toUpperCase()}.pdf`);
}

function generatePaymentReceiptPDF(pago, prestamo, organizacion) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
    const W = doc.internal.pageSize.getWidth();
    const sym = SYM(prestamo.moneda);
    const symPago = SYM(pago.moneda_pago);

    // Header
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('RECIBO DE PAGO', W / 2, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(organizacion?.nombre || 'GARSEA', W / 2, 21, { align: 'center' });
    doc.text(`Ref. Contrato: #${prestamo.id.split('-')[0].toUpperCase()}`, W / 2, 27, { align: 'center' });

    // Amount hero
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text(`${symPago} ${fmt(pago.monto_abonado)}`, W / 2, 50, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('MONTO ABONADO', W / 2, 56, { align: 'center' });

    // Details
    const rows = [
        ['Cliente', prestamo.clientes?.nombre || ''],
        ['C.I.', `V-${prestamo.cliente_cedula}`],
        ['Fecha de Pago', fmtDateTime(pago.fecha_pago)],
        ['Método', pago.metodo_pago.toUpperCase()],
        ['Moneda del Pago', pago.moneda_pago],
        ['Tasa de Cambio', pago.tasa_cambio ? `${fmt(pago.tasa_cambio, 4)} Bs/$` : 'N/A'],
        ['Saldo Anterior', `${sym} ${fmt(pago.saldo_anterior)}`],
        ['Saldo Actual', `${sym} ${fmt(pago.saldo_nuevo)}`],
        ['Notas', pago.notas || '—'],
        ['Registrado por', pago.registrado_por || '—'],
    ];

    doc.autoTable({
        startY: 62,
        head: [],
        body: rows,
        theme: 'striped',
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
        styles: { fontSize: 9, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [240, 253, 244] },
        margin: { left: 10, right: 10 },
    });

    // Footer
    doc.setTextColor(160);
    doc.setFontSize(7);
    doc.text(`${organizacion?.nombre || 'GARSEA'} • Emitido el ${fmtDateTime(new Date())}`, W / 2, doc.lastAutoTable.finalY + 10, { align: 'center' });

    doc.save(`Recibo_Pago_${prestamo.clientes?.nombre?.replace(/\s/g, '_')}_${fmtDate(pago.fecha_pago).replace(/\//g, '-')}.pdf`);
}

/* ─── Main Component ────────────────────────────────────────── */
const PrestamoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { organizacion, user } = useAuthStore();

    const [prestamo, setPrestamo] = useState(null);
    const [pagos, setPagos] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Receipt upload for each payment
    const receiptInputRef = useRef(null);
    const [attachingPagoId, setAttachingPagoId] = useState(null);

    const [paymentForm, setPaymentForm] = useState({
        monto: '',
        moneda_pago: 'USD',
        tasa_cambio: '1.00',
        metodo_pago: 'efectivo',
        nota: '',
        receiptFile: null,
        receiptPreview: null,
    });

    const { todayRate, fetchTodayRate, getActiveRate } = useRateStore();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (organizacion?.id && id) {
            loadData();
            fetchTodayRate(organizacion.id);
        }
    }, [organizacion?.id, id]);

    useEffect(() => {
        if (prestamo) {
            const currentTasa = getActiveRate(organizacion?.tasa_referencia_pref) || 1.00;
            setPaymentForm(prev => ({
                ...prev,
                moneda_pago: prestamo.moneda,
                tasa_cambio: currentTasa.toString()
            }));
        }
    }, [prestamo, todayRate, organizacion?.tasa_referencia_pref]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [loanData, paymentsData, docsData] = await Promise.all([
                loanService.getById(id, organizacion.id),
                paymentService.getByLoan(id, organizacion.id),
                storageService.getDocumentsByLoan(id, organizacion.id),
            ]);
            setPrestamo(loanData);
            setPagos(paymentsData);
            setDocumentos(docsData);
        } catch (error) {
            console.error('Error cargando detalle del préstamo:', error);
            toast.error('No se pudo encontrar el préstamo');
            navigate('/prestamos');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPayment = async (e) => {
        e.preventDefault();

        const montoInput = parseFloat(paymentForm.monto);
        const tasa = parseFloat(paymentForm.tasa_cambio) || 1;

        if (!montoInput || montoInput <= 0) { toast.error('Ingresa un monto válido'); return; }

        let montoDebitado = montoInput;
        if (paymentForm.moneda_pago !== prestamo.moneda) {
            if (prestamo.moneda === 'USD' && paymentForm.moneda_pago === 'VES') montoDebitado = montoInput / tasa;
            else if (prestamo.moneda === 'VES' && paymentForm.moneda_pago === 'USD') montoDebitado = montoInput * tasa;
        }

        if (montoDebitado > (prestamo.saldo_pendiente + 0.01)) {
            toast.error('El monto excede el saldo pendiente'); return;
        }

        try {
            setPaymentLoading(true);
            const newPago = await paymentService.create({
                organizacion_id: organizacion.id,
                prestamo_id: id,
                monto_abonado: montoDebitado,
                moneda_pago: paymentForm.moneda_pago,
                tasa_cambio: tasa,
                metodo_pago: paymentForm.metodo_pago,
                notas: paymentForm.nota,
                registrado_por: user.cedula,
                saldo_anterior: prestamo.saldo_pendiente,
                saldo_nuevo: Math.max(0, prestamo.saldo_pendiente - montoDebitado)
            });

            // Upload receipt if attached
            if (paymentForm.receiptFile && newPago?.id) {
                try {
                    toast.loading('Subiendo comprobante...', { id: 'receipt-upload' });
                    const uploadResult = await storageService.uploadPaymentReceipt(paymentForm.receiptFile, organizacion.id);
                    await storageService.registerDocument({
                        organizacion_id: organizacion.id,
                        tipo_entidad: 'pago',
                        entidad_id: newPago.id,
                        tipo_documento: 'comprobante',
                        nombre_archivo: uploadResult.name,
                        url_archivo: uploadResult.url,
                        tamaño_bytes: uploadResult.size,
                        mime_type: uploadResult.type,
                        subido_por: user?.cedula || 'SISTEMA'
                    });
                    toast.success('Comprobante guardado', { id: 'receipt-upload' });
                } catch (uploadErr) {
                    console.error('Error subiendo comprobante:', uploadErr);
                    toast.error('No se pudo guardar el comprobante', { id: 'receipt-upload' });
                }
            }

            toast.success('¡Pago registrado exitosamente!');
            addNotification({
                title: 'Pago Recibido',
                message: `Se registró un abono de ${paymentForm.monto} ${paymentForm.moneda_pago} de ${prestamo.clientes?.nombre}.`,
                type: 'success'
            });

            setIsPaymentModalOpen(false);
            setPaymentForm({
                monto: '',
                moneda_pago: prestamo.moneda,
                tasa_cambio: (getActiveRate(organizacion?.tasa_referencia_pref) || 1).toString(),
                metodo_pago: 'efectivo',
                nota: '',
                receiptFile: null,
                receiptPreview: null,
            });
            await loadData();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al registrar el pago');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleAttachReceipt = async (pagoId, file) => {
        if (!file) return;
        setAttachingPagoId(pagoId);
        try {
            toast.loading('Subiendo comprobante...', { id: 'attach' });
            const uploadResult = await storageService.uploadPaymentReceipt(file, organizacion.id);
            await storageService.registerDocument({
                organizacion_id: organizacion.id,
                tipo_entidad: 'pago',
                entidad_id: pagoId,
                tipo_documento: 'comprobante',
                nombre_archivo: uploadResult.name,
                url_archivo: uploadResult.url,
                tamaño_bytes: uploadResult.size,
                mime_type: uploadResult.type,
                subido_por: user?.cedula || 'SISTEMA'
            });
            toast.success('Comprobante adjuntado', { id: 'attach' });
            await loadData();
        } catch (err) {
            toast.error('Error al subir el comprobante', { id: 'attach' });
        } finally {
            setAttachingPagoId(null);
        }
    };

    const garantiaDocs = documentos.filter(d => d.tipo_documento === 'garantia');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">Cargando contrato...</p>
                </div>
            </div>
        );
    }

    const progress = ((prestamo.total_a_pagar - prestamo.saldo_pendiente) / prestamo.total_a_pagar) * 100;
    const sym = SYM(prestamo.moneda);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 transition-colors duration-200">
            {/* Header */}
            <div className={`pt-8 pb-32 relative overflow-hidden ${prestamo.estado === 'pagado' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.2em] opacity-70 mb-2">Contrato de Préstamo</p>
                            <h1 className="text-3xl sm:text-4xl font-black mb-3 italic">
                                #{prestamo.id.split('-')[0].toUpperCase()}
                            </h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold border border-white/20">
                                    {prestamo.tipo_pago.toUpperCase()}
                                </span>
                                <span className={`px-3 py-1 rounded-lg text-sm font-black tracking-wider shadow-lg ${prestamo.estado === 'pagado' ? 'bg-emerald-400 text-emerald-900' : 'bg-white text-indigo-700'}`}>
                                    {prestamo.estado.toUpperCase()}
                                </span>
                                {/* PDF Download Button */}
                                <button
                                    onClick={() => generateContractPDF(prestamo, pagos, organizacion)}
                                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold border border-white/20 transition-all active:scale-95"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" />
                                    PDF Contrato
                                </button>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Actual</p>
                            <p className="text-5xl font-black italic">
                                {sym}{fmt(prestamo.saldo_pendiente)}
                            </p>
                            {todayRate && (
                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 mt-1">
                                    ≈ {prestamo.moneda === 'USD' ? 'Bs' : '$'}
                                    {fmt(prestamo.moneda === 'USD'
                                        ? prestamo.saldo_pendiente * getActiveRate(organizacion?.tasa_referencia_pref)
                                        : prestamo.saldo_pendiente / getActiveRate(organizacion?.tasa_referencia_pref)
                                    )} al cambio
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent" />
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 space-y-8">
                {/* Top Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Credit Status */}
                    <Card className="md:col-span-2 shadow-2xl border-none">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ArrowPathIcon className="w-6 h-6 text-indigo-500" />
                                Estado del Crédito
                            </h2>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Progreso de Pago</span>
                                    <span className="text-2xl font-black text-indigo-600">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out rounded-full ${prestamo.estado === 'pagado' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${progress}%`, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                                {[
                                    { label: 'Monto Inicial', val: `${sym}${fmt(prestamo.monto_capital)}` },
                                    { label: `Interés (${prestamo.porcentaje_interes}%)`, val: `${sym}${fmt(prestamo.total_a_pagar - prestamo.monto_capital)}` },
                                    { label: 'Total a Pagar', val: `${sym}${fmt(prestamo.total_a_pagar)}`, highlight: true },
                                ].map(item => (
                                    <div key={item.label}>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{item.label}</p>
                                        <p className={`text-lg font-bold ${item.highlight ? 'text-indigo-600' : 'text-gray-900 dark:text-white'}`}>{item.val}</p>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Termina: {fmtDate(prestamo.fecha_fin)}</span>
                                </div>
                                {prestamo.tiene_garantia && (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <span className="text-xs font-black">GARANTÍA ACTIVA</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Client Card */}
                    <Card className="shadow-2xl border-none">
                        <h3 className="text-sm font-black text-gray-400 uppercase mb-4 tracking-widest">Titular del Crédito</h3>
                        <div
                            className="flex flex-col items-center text-center p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                            onClick={() => navigate(`/clientes/${prestamo.cliente_cedula}`)}
                        >
                            <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mb-4 shadow-xl">
                                {prestamo.clientes?.nombre.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1">{prestamo.clientes?.nombre}</h4>
                            <p className="text-sm font-bold text-indigo-600 mb-4">C.I. {prestamo.cliente_cedula}</p>
                            <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                    <ClockIcon className="w-4 h-4" />
                                    Desde {fmtDate(prestamo.fecha_creacion)}
                                </div>
                            </div>
                        </div>

                        {prestamo.estado !== 'pagado' && (
                            <Button
                                variant="primary"
                                fullWidth
                                className="mt-6 !py-5 shadow-xl shadow-indigo-600/20 active:scale-95"
                                onClick={() => setIsPaymentModalOpen(true)}
                            >
                                <CheckBadgeIcon className="w-6 h-6" />
                                Registrar Pago
                            </Button>
                        )}
                    </Card>
                </div>

                {/* ── Galería de Garantías ─────────────────────────── */}
                {(prestamo.tiene_garantia || garantiaDocs.length > 0) && (
                    <Card className="shadow-xl border-none">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ShieldCheckIcon className="w-6 h-6 text-emerald-500" />
                                Garantía del Préstamo
                            </h2>
                            {garantiaDocs.length > 0 && (
                                <span className="text-xs font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full">
                                    {garantiaDocs.length} foto{garantiaDocs.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {prestamo.descripcion_garantia && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl px-4 py-3 font-medium">
                                {prestamo.descripcion_garantia}
                            </p>
                        )}

                        {garantiaDocs.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {garantiaDocs.map((doc, idx) => (
                                    <div
                                        key={doc.id}
                                        className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-400 transition-all shadow-sm hover:shadow-lg"
                                        onClick={() => { setGalleryIndex(idx); setIsGalleryOpen(true); }}
                                    >
                                        <img src={doc.url_archivo} alt={doc.nombre_archivo} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                            <EyeIcon className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-semibold">No se adjuntaron fotos de garantía</p>
                            </div>
                        )}
                    </Card>
                )}

                {/* ── Historial de Pagos ──────────────────────────── */}
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3 px-2 italic">
                        <ClockIcon className="w-7 h-7 text-indigo-500" />
                        Cronograma de Pagos
                    </h2>

                    {pagos.length > 0 ? (
                        <Card className="shadow-xl border-none p-2 divide-y divide-gray-100 dark:divide-gray-800">
                            {pagos.map((pago, idx) => {
                                const pagoDocs = documentos.filter(d => d.tipo_entidad === 'pago' && d.entidad_id === pago.id);
                                return (
                                    <div key={pago.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-lg flex-shrink-0">
                                                    {pagos.length - idx}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 dark:text-white">Abono a Cuenta</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        {fmtDateTime(pago.fecha_pago)} · {pago.metodo_pago.toUpperCase()}
                                                    </p>
                                                    {pago.notas && <p className="text-xs text-gray-500 mt-0.5 italic">{pago.notas}</p>}
                                                    {pago.moneda_pago !== prestamo.moneda && (
                                                        <p className="text-[9px] text-indigo-500 font-bold mt-1">
                                                            Pagado en {pago.moneda_pago} · Tasa: {fmt(pago.tasa_cambio, 4)} Bs/$
                                                        </p>
                                                    )}

                                                    {/* Comprobante adjunto */}
                                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                        {pagoDocs.map(doc => (
                                                            <a
                                                                key={doc.id}
                                                                href={doc.url_archivo}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-1 text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                                                            >
                                                                <PhotoIcon className="w-3 h-3" />
                                                                Comprobante
                                                            </a>
                                                        ))}

                                                        {pagoDocs.length === 0 && (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    accept="image/*,application/pdf"
                                                                    className="hidden"
                                                                    id={`receipt-${pago.id}`}
                                                                    onChange={(e) => handleAttachReceipt(pago.id, e.target.files[0])}
                                                                />
                                                                <label
                                                                    htmlFor={`receipt-${pago.id}`}
                                                                    className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer transition-colors ${attachingPagoId === pago.id ? 'text-gray-400 bg-gray-100 dark:bg-gray-700' : 'text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                                                >
                                                                    <PlusIcon className="w-3 h-3" />
                                                                    {attachingPagoId === pago.id ? 'Subiendo...' : 'Adjuntar comprobante'}
                                                                </label>
                                                            </>
                                                        )}

                                                        {/* Recibo PDF */}
                                                        <button
                                                            onClick={() => generatePaymentReceiptPDF(pago, prestamo, organizacion)}
                                                            className="flex items-center gap-1 text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors"
                                                        >
                                                            <DocumentTextIcon className="w-3 h-3" />
                                                            PDF Recibo
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xl font-black text-emerald-600">
                                                    {SYM(pago.moneda_pago)}{fmt(pago.monto_abonado)}
                                                </p>
                                                <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">Abono</p>
                                                <p className="text-xs font-bold text-gray-500 mt-1">
                                                    Saldo: {sym}{fmt(pago.saldo_nuevo)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </Card>
                    ) : (
                        <Card className="text-center py-20 bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-none">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ReceiptPercentIcon className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 italic">Sin movimientos aún</h3>
                            <p className="text-gray-500 dark:text-gray-400">Este préstamo no registra amortizaciones.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* ── Modal de Pago ─────────────────────────────────── */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Registrar Pago">
                <form onSubmit={handleRegisterPayment} className="space-y-6">
                    {/* Resumen */}
                    <div className="p-7 bg-gray-950 rounded-[2.5rem] text-white overflow-hidden relative border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Resumen de Deuda</p>
                        <div className="flex items-end justify-between relative z-10">
                            <div>
                                <p className="text-4xl font-black italic tracking-tighter">
                                    {sym}{fmt(prestamo.saldo_pendiente)}
                                </p>
                                <p className="text-[9px] font-black text-indigo-400 mt-1 uppercase">Saldo Total Pendiente</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-emerald-400 italic">
                                    {sym}{fmt(prestamo.total_a_pagar / (prestamo.num_cuotas || 1))}
                                </p>
                                <p className="text-[9px] font-black opacity-40 uppercase">Cuota Sugerida</p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Moneda */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Moneda del Pago</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                {['USD', 'VES'].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setPaymentForm({ ...paymentForm, moneda_pago: m })}
                                        className={`py-2 rounded-xl text-xs font-black transition-all ${paymentForm.moneda_pago === m ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-400 opacity-50'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tasa */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1">
                                Tasa <LockClosedIcon className="w-3 h-3" />
                            </label>
                            <div className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-3xl text-gray-500 font-black flex items-center justify-between cursor-not-allowed opacity-80">
                                <span className="text-gray-900 dark:text-white text-lg flex items-baseline gap-1">
                                    {fmt(parseFloat(paymentForm.tasa_cambio), 4)}
                                    <span className="text-xs font-bold text-gray-400">Bs</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Monto */}
                    <div className="relative">
                        <Input
                            label={`Monto a Recibir (${paymentForm.moneda_pago})`}
                            type="number"
                            required
                            step="0.01"
                            value={paymentForm.monto}
                            onChange={(e) => {
                                const val = e.target.value;
                                const rate = parseFloat(paymentForm.tasa_cambio) || 1;
                                let max = prestamo.saldo_pendiente;
                                if (prestamo.moneda === 'USD' && paymentForm.moneda_pago === 'VES') max *= rate;
                                else if (prestamo.moneda === 'VES' && paymentForm.moneda_pago === 'USD') max /= rate;
                                if (val !== '' && parseFloat(val) > (max + 0.1)) {
                                    toast.error(`Máximo: ${fmt(max)} ${paymentForm.moneda_pago}`, { id: 'max-err' });
                                    return;
                                }
                                setPaymentForm({ ...paymentForm, monto: val });
                            }}
                            placeholder="0.00"
                            icon={<CurrencyDollarIcon className="w-5 h-5 text-indigo-500" />}
                        />
                        {paymentForm.monto && paymentForm.moneda_pago !== prestamo.moneda && (
                            <div className="absolute top-2 right-2 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black border border-emerald-500/20">
                                EQUIV: {sym}{fmt(paymentForm.moneda_pago === 'USD'
                                    ? parseFloat(paymentForm.monto) * parseFloat(paymentForm.tasa_cambio)
                                    : parseFloat(paymentForm.monto) / parseFloat(paymentForm.tasa_cambio)
                                )}
                            </div>
                        )}
                    </div>

                    {/* Método */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vía de Recepción</label>
                        <select
                            value={paymentForm.metodo_pago}
                            onChange={(e) => setPaymentForm({ ...paymentForm, metodo_pago: e.target.value })}
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-3xl text-sm outline-none transition-all font-bold text-gray-900 dark:text-white"
                        >
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="pago_movil">📱 Pago Móvil</option>
                            <option value="zelle">⚡ Zelle / Transferencia $</option>
                            <option value="transferencia">🏦 Transferencia Local</option>
                            <option value="otro">📑 Otro Método</option>
                        </select>
                    </div>

                    <Input
                        label="Nota / Nro. Referencia"
                        value={paymentForm.nota}
                        onChange={(e) => setPaymentForm({ ...paymentForm, nota: e.target.value })}
                        placeholder="Sin observaciones..."
                    />

                    {/* Comprobante adjunto al momento del pago */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Comprobante (opcional)</label>
                        {paymentForm.receiptPreview ? (
                            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800">
                                <img src={paymentForm.receiptPreview} alt="comprobante" className="w-full max-h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setPaymentForm({ ...paymentForm, receiptFile: null, receiptPreview: null })}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="w-full flex items-center justify-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-indigo-400 transition-all group">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setPaymentForm({
                                            ...paymentForm,
                                            receiptFile: file,
                                            receiptPreview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                                        });
                                    }}
                                />
                                <PhotoIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-600">
                                    Adjuntar foto de comprobante
                                </span>
                            </label>
                        )}
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        loading={paymentLoading}
                        className="!rounded-[2rem] !py-6 shadow-2xl shadow-indigo-600/30 text-base font-black italic tracking-tight"
                    >
                        REGISTRAR ABONO
                    </Button>
                </form>
            </Modal>

            {/* ── Lightbox de Garantías ─────────────────────────── */}
            {isGalleryOpen && garantiaDocs.length > 0 && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
                    onClick={() => setIsGalleryOpen(false)}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"
                        onClick={() => setIsGalleryOpen(false)}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4 px-4 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <button
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all flex-shrink-0 disabled:opacity-30"
                            disabled={galleryIndex === 0}
                            onClick={() => setGalleryIndex(i => i - 1)}
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>

                        <div className="flex-1 flex flex-col items-center gap-4">
                            <img
                                src={garantiaDocs[galleryIndex].url_archivo}
                                alt={garantiaDocs[galleryIndex].nombre_archivo}
                                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
                            />
                            <p className="text-white/60 text-xs font-bold">
                                {galleryIndex + 1} / {garantiaDocs.length} · {garantiaDocs[galleryIndex].nombre_archivo}
                            </p>
                            <a
                                href={garantiaDocs[galleryIndex].url_archivo}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 text-xs font-black text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                                Abrir original
                            </a>
                        </div>

                        <button
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all flex-shrink-0 disabled:opacity-30 rotate-180"
                            disabled={galleryIndex === garantiaDocs.length - 1}
                            onClick={() => setGalleryIndex(i => i + 1)}
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="absolute bottom-6 flex gap-2">
                        {garantiaDocs.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                                className={`w-2 h-2 rounded-full transition-all ${i === galleryIndex ? 'bg-white w-6' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrestamoDetalle;
