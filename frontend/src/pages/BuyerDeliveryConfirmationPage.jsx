import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  Building,
  Scale,
  FileText,
  UploadCloud,
  XCircle,
  HelpCircle,
  Printer,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Check,
  RefreshCw,
  Award,
  Layers,
  MapPin,
  ExternalLink,
  Activity,
  Compass
} from 'lucide-react';
import { validateDeliveryTokenApi, confirmBuyerDeliveryApi } from '../services/api';

// =============================================================================
// SUB-COMPONENT: 8-STAGE LIVE ORDER TRACKER TIMELINE
// =============================================================================
const BuyerOrderTracker = ({ status, orderData }) => {
  const isQualityDone = Boolean(orderData?.quality_records && orderData.quality_records.some(q => q.quality_status === 'APPROVED')) ||
    ['QUALITY_APPROVED', 'PACKAGING', 'DOCUMENTS_PENDING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status);

  const isPackagingDone = Boolean(orderData?.packaging_records && orderData.packaging_records.length > 0) ||
    ['PACKAGING', 'DOCUMENTS_PENDING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status);

  const isDocsDone = Boolean(orderData?.documents && orderData.documents.length > 0) ||
    ['DOCUMENTS_PENDING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status);

  const isReadyShipment = Boolean(orderData?.shipments && orderData.shipments.length > 0) ||
    ['READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status);

  const isShipped = ['SHIPPED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status);
  const isInTransit = ['IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'].includes(status);
  const isDelivered = ['DELIVERED', 'ARRIVED', 'COMPLETED'].includes(status) || Boolean(orderData?.delivery_confirmation);

  const steps = [
    { key: 'CONFIRMED', label: 'Order Confirmed', done: true, sub: orderData?.buyer_confirmed_order_at ? new Date(orderData.buyer_confirmed_order_at).toLocaleDateString() : 'Verified' },
    { key: 'QUALITY', label: 'Quality Approved', done: isQualityDone, sub: orderData?.quality_records?.[0] ? `${orderData.quality_records[0].moisture_percentage}% Moisture` : 'Inspection' },
    { key: 'PACKAGING', label: 'Packaging Completed', done: isPackagingDone, sub: orderData?.packaging_records?.[0] ? `${orderData.packaging_records[0].packaging_type}` : 'Packaging' },
    { key: 'DOCS', label: 'Export Documents', done: isDocsDone, sub: orderData?.documents?.length ? `${orderData.documents.length} Verified` : 'Documentation' },
    { key: 'READY', label: 'Ready for Shipment', done: isReadyShipment, sub: 'Staged' },
    { key: 'SHIPPED', label: 'Shipped', done: isShipped, sub: orderData?.carrier || 'Dispatched' },
    { key: 'TRANSIT', label: 'In Transit', done: isInTransit, sub: (orderData?.tracking_number && orderData.tracking_number !== 'N/A') ? orderData.tracking_number : 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered & Confirmed', done: isDelivered, sub: isDelivered ? 'Arrived' : 'Destination Port' }
  ];

  let activeIndex = 0;
  steps.forEach((s, idx) => {
    if (s.done) activeIndex = idx;
  });

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '1.25rem', border: '1px solid #E2E8F0', margin: '1.25rem 0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1B4D2E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Activity size={17} color="#16A34A" /> Live Fulfillment &amp; Shipment Journey
        </div>
        <span style={{ fontSize: '0.75rem', backgroundColor: isDelivered ? '#DCFCE7' : '#E0F2FE', color: isDelivered ? '#166534' : '#0369A1', padding: '0.2rem 0.65rem', borderRadius: '20px', fontWeight: '800' }}>
          Stage {activeIndex + 1} of {steps.length}: {steps[activeIndex].label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
        {steps.map((st, idx) => {
          const isCurrent = idx === activeIndex && !isDelivered;
          return (
            <div key={st.key} style={{ minWidth: '95px', textAlign: 'center', position: 'relative' }}>
              <div
                style={{
                  height: '4px',
                  backgroundColor: st.done ? '#16A34A' : '#E2E8F0',
                  borderRadius: '2px',
                  marginBottom: '0.6rem',
                }}
              />
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: st.done ? '#16A34A' : '#F1F5F9',
                  color: st.done ? '#FFF' : '#94A3B8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(22, 163, 74, 0.25)' : 'none',
                  transition: 'all 0.3s'
                }}
              >
                {st.done ? <Check size={14} strokeWidth={3} /> : idx + 1}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: st.done ? '800' : '600', color: st.done ? '#0F172A' : '#94A3B8', marginTop: '0.35rem', lineHeight: 1.2 }}>
                {st.label}
              </div>
              <div style={{ fontSize: '0.65rem', color: isCurrent ? '#16A34A' : '#64748B', fontWeight: isCurrent ? '700' : '500', marginTop: '0.15rem' }}>
                {st.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT: BUYER DELIVERY CONFIRMATION & LIVE TRACKER
// =============================================================================
export const BuyerDeliveryConfirmationPage = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get('token');

  // Loading & Validation State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [errorState, setErrorState] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [justConfirmedOrder, setJustConfirmedOrder] = useState(false);

  // Form State
  const [quantityReceived, setQuantityReceived] = useState('');
  const [deliveryCondition, setDeliveryCondition] = useState('GOOD');
  const [comments, setComments] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [fileError, setFileError] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Fetch / Validate Token Function
  const loadOrderData = useCallback(async (isManualRefresh = false) => {
    if (!token) {
      setLoading(false);
      setErrorState({
        code: 'MISSING_TOKEN',
        message: 'No confirmation token was provided in the link. Please check the URL in your email.',
      });
      return;
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorState(null);

    try {
      const res = await validateDeliveryTokenApi(token);
      if (res.success && res.data?.order) {
        setOrderData(res.data.order);
        setLastRefreshedAt(new Date());
        if (res.data.order.quantity_ordered_kg && !quantityReceived) {
          setQuantityReceived(String(res.data.order.quantity_ordered_kg));
        }
        if (res.data.order.delivery_confirmation) {
          setConfirmationResult(res.data.order.delivery_confirmation);
        }
      } else {
        setErrorState({
          code: res.code || 'INVALID_TOKEN',
          message: res.message || 'This confirmation link is invalid or has expired.',
          reference: res.reference,
          confirmed_at: res.confirmed_at,
        });
      }
    } catch (err) {
      setErrorState({
        code: 'ERROR',
        message: err.message || 'Unable to retrieve order details. Please check your network connection or contact the exporter.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, quantityReceived]);

  useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);

  // File Change Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setEvidenceFile(null);
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds the 10 MB limit.');
      return;
    }

    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const lowerName = file.name.toLowerCase();
    const isAllowed = allowed.some((ext) => lowerName.endsWith(ext));
    if (!isAllowed) {
      setFileError('Only JPG, PNG, WEBP images or PDF files are allowed.');
      return;
    }

    setEvidenceFile(file);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const qty = parseFloat(quantityReceived);
    if (isNaN(qty) || qty <= 0) {
      setSubmitError('Please enter a valid quantity greater than 0 KG.');
      return;
    }

    const isOrderConfirmStage = orderData?.stage === 'ORDER_CONFIRM' && !orderData?.buyer_confirmed_order;

    if (!isOrderConfirmStage && deliveryCondition !== 'GOOD' && !comments.trim()) {
      setSubmitError('Please provide a brief explanation in the comments regarding the shortage or damage.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('quantity_received_kg', qty.toString());

      if (isOrderConfirmStage) {
        formData.append('action', 'CONFIRM_ORDER');
        formData.append('stage', 'ORDER_CONFIRM');
      } else {
        formData.append('action', 'CONFIRM_DELIVERY');
        formData.append('stage', 'DELIVERY_REVIEW');
        formData.append('delivery_condition', deliveryCondition);
        formData.append('comments', comments.trim());
        if (evidenceFile) {
          formData.append('evidence_file', evidenceFile);
        }
      }

      const res = await confirmBuyerDeliveryApi(formData);
      if (res.success) {
        if (isOrderConfirmStage) {
          setJustConfirmedOrder(true);
          await loadOrderData(true);
        } else if (res.data?.confirmation) {
          setConfirmationResult({
            ...res.data.confirmation,
            stage: 'DELIVERY_CONFIRMED'
          });
          await loadOrderData(true);
        }
      } else {
        setSubmitError(res.message || 'Failed to submit confirmation.');
      }
    } catch (err) {
      setSubmitError(err.message || 'An unexpected error occurred while submitting confirmation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isConfirmed = Boolean(orderData?.buyer_confirmed_order);
  const isDeliveryReviewStage = orderData?.stage === 'DELIVERY_REVIEW';
  const isDeliveryConfirmedStage = orderData?.stage === 'DELIVERY_CONFIRMED' || Boolean(confirmationResult?.confirmation_reference);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF9',
        color: '#0F172A',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0F5A2C 0%, #16A34A 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 10px rgba(15,90,44,0.2)',
              }}
            >
              <Sprout size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#073B1E', letterSpacing: '-0.02em' }}>
                CardaLink
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                Smart Cardamom Plantation &amp; Export Management System
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: isConfirmed ? '#DCFCE7' : '#F0FDF4',
              border: '1px solid #BBF7D0',
              fontSize: '0.8rem',
              color: '#0F5A2C',
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={16} />
            <span>{isConfirmed ? 'Verified Buyer Tracking Portal' : 'Secure Buyer Verification'}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: '920px',
          width: '100%',
          margin: '28px auto',
          padding: '0 20px',
        }}
      >
        {/* Loading State */}
        {loading && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '60px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid #DCFCE7',
                borderTopColor: '#16A34A',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px',
              }}
            />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
              Validating Confirmation Token &amp; Live Tracking...
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
              Connecting with CardaLink export network to retrieve your real-time order and shipment updates.
            </p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error / Revoked / Expired State (Only if order not confirmed) */}
        {!loading && errorState && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '40px 32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #FEE2E2',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <XCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
              {errorState.code === 'TOKEN_EXPIRED' ? 'Confirmation Link Expired' : 'Invalid Confirmation Link'}
            </h2>

            <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              {errorState.message}
            </p>

            <div
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '12px',
                padding: '16px 20px',
                maxWidth: '600px',
                margin: '0 auto',
                fontSize: '0.9rem',
                color: '#166534',
                textAlign: 'left',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <HelpCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Need Assistance?</strong>
                <p style={{ marginTop: '4px', color: '#14532D' }}>
                  If you need a new confirmation or tracking link, please contact your exporter directly. They can issue a fresh,
                  secure link at any time from their CardaLink Exporter Dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 1: INITIAL UNCONFIRMED ORDER (Buyer must confirm order first)
            ========================================================================= */}
        {!loading && !errorState && orderData && !isConfirmed && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #073B1E 0%, #0F5A2C 100%)',
                color: '#FFFFFF',
                padding: '28px 32px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      marginBottom: '8px',
                    }}
                  >
                    <Package size={14} />
                    <span>EXPORT ORDER CONFIRMATION</span>
                  </div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    Confirm Export Order
                  </h1>
                  <p style={{ color: '#BBF7D0', fontSize: '0.9rem', marginTop: '6px', margin: 0 }}>
                    Please verify the order specifications initiated by <strong>{orderData.exporter_company_name || orderData.exporter_name}</strong>.
                    Once confirmed, this email link will become your <strong>Live Order Tracker</strong>.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.8rem',
                    color: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={15} style={{ color: '#FBBF24' }} />
                  <span>
                    Valid until: {new Date(orderData.token_expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment & Order Information Card */}
            <div
              style={{
                padding: '24px 32px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Order Specifications
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Building size={18} style={{ color: '#0F5A2C', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Exporter / Supplier</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {orderData.exporter_company_name || orderData.exporter_name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Scale size={18} style={{ color: '#0F5A2C', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Product &amp; Grade</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {orderData.variety_name || 'Cardamom'} ({orderData.grade})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Package size={18} style={{ color: '#0F5A2C', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Ordered Quantity</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {orderData.quantity_ordered_kg} KG
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <MapPin size={18} style={{ color: '#0F5A2C', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Destination Port</div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}>
                      {orderData.destination_port}, {orderData.destination_country}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Order Confirmation Form */}
            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
              {submitError && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    color: '#991B1B',
                    fontSize: '0.9rem',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{submitError}</span>
                </div>
              )}

              <div style={{ marginBottom: '28px' }}>
                <label
                  htmlFor="quantityReceived"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: '8px',
                  }}
                >
                  Confirmed Purchase Quantity (KG) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative', maxWidth: '320px' }}>
                  <input
                    id="quantityReceived"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={quantityReceived}
                    onChange={(e) => setQuantityReceived(e.target.value)}
                    placeholder="e.g. 500.00"
                    style={{
                      width: '100%',
                      padding: '12px 50px 12px 16px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748B',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    KG
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>
                  Expected Order Quantity: <strong>{orderData.quantity_ordered_kg} KG</strong>. Confirm or adjust if agreed with exporter.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingTop: '20px',
                  borderTop: '1px solid #E2E8F0',
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: submitting ? '#94A3B8' : '#0F5A2C',
                    color: '#FFFFFF',
                    padding: '14px 36px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(15,90,44,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {submitting ? (
                    <>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid #FFFFFF',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Confirming Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Confirm Order &amp; Activate Live Tracker</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            STATE 2: CONFIRMED ORDER — FULL LIVE TRACKER PORTAL
            ========================================================================= */}
        {!loading && !errorState && orderData && isConfirmed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Congratulatory Alert (if just confirmed) */}
            {justConfirmedOrder && (
              <div
                style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  borderRadius: '14px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={24} color="#15803D" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.95rem' }}>
                      Order Successfully Confirmed! Live Tracker Activated
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#14532D', marginTop: '2px' }}>
                      You can return to this email link anytime to view real-time updates as the exporter checks quality, completes packaging, and dispatches your shipment.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setJustConfirmedOrder(false)}
                  style={{ background: 'none', border: 'none', color: '#166534', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
                >
                  &times;
                </button>
              </div>
            )}

            {/* Live Tracker Main Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
              }}
            >
              {/* Live Tracker Header Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #073B1E 0%, #0F5A2C 100%)',
                  color: '#FFFFFF',
                  padding: '24px 30px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.6rem', borderRadius: '6px', letterSpacing: '0.04em' }}>
                        LIVE SHIPMENT TRACKER
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', backgroundColor: '#22C55E', color: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '12px', fontWeight: 800 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF', animation: 'pulse 1.5s infinite' }} />
                        LIVE
                      </span>
                    </div>

                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Order {orderData.order_code}
                    </h1>

                    <div style={{ color: '#BBF7D0', fontSize: '0.85rem', marginTop: '6px' }}>
                      Buyer: <strong>{orderData.buyer_name || 'Customer'}</strong> &bull; Exporter: <strong>{orderData.exporter_company_name || orderData.exporter_name}</strong> &bull; Destination: <strong>{orderData.destination_port}, {orderData.destination_country}</strong>
                    </div>
                  </div>

                  {/* Refresh Button & Timestamp */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => loadOrderData(true)}
                      disabled={refreshing}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: refreshing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                      <span>{refreshing ? 'Updating...' : 'Check Live Updates'}</span>
                    </button>
                    {lastRefreshedAt && (
                      <span style={{ fontSize: '0.7rem', color: '#BBF7D0' }}>
                        Last checked: {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual 8-Stage Tracker */}
              <div style={{ padding: '20px 28px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <BuyerOrderTracker status={orderData.order_status} orderData={orderData} />
              </div>

              {/* 4 Detailed Status Cards Grid */}
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {/* Card 1: Product & Quantity */}
                <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1B4D2E', fontWeight: 800, fontSize: '0.85rem', marginBottom: '10px' }}>
                    <Package size={17} color="#16A34A" /> Cargo &amp; Specifications
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                    <div>Product: <strong style={{ color: '#0F172A' }}>{orderData.cardamom_variety}</strong></div>
                    <div>Grade: <strong style={{ color: '#0F172A' }}>{orderData.grade}</strong></div>
                    <div>Confirmed Weight: <strong style={{ color: '#16A34A', fontSize: '0.9rem' }}>{orderData.quantity_kg} KG</strong></div>
                    <div>Incoterms: <strong>{orderData.incoterms}</strong></div>
                  </div>
                </div>

                {/* Card 2: Quality Inspection */}
                <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.85rem' }}>
                      <Award size={17} color="#16A34A" /> Quality &amp; Grading
                    </div>
                    {orderData.quality_records?.length > 0 ? (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        ✓ APPROVED
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        In Inspection
                      </span>
                    )}
                  </div>
                  {orderData.quality_records?.length > 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                      <div>Moisture: <strong>{orderData.quality_records[0].moisture_percentage}%</strong></div>
                      <div>Capsule Size: <strong>{orderData.quality_records[0].size_mm}</strong></div>
                      <div>Appearance: <strong>{orderData.quality_records[0].color_appearance}</strong></div>
                      <div>Verified by: {orderData.quality_records[0].inspector_name}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      Laboratory moisture and grading inspection currently underway.
                    </div>
                  )}
                </div>

                {/* Card 3: Packaging Breakdown */}
                <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369A1', fontWeight: 800, fontSize: '0.85rem' }}>
                      <Layers size={17} color="#0284C7" /> Packaging Details
                    </div>
                    {orderData.packaging_records?.length > 0 ? (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        ✓ PACKED
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        Scheduled
                      </span>
                    )}
                  </div>
                  {orderData.packaging_records?.length > 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                      <div>Type: <strong style={{ color: '#0F172A' }}>{orderData.packaging_records[0].packaging_type}</strong></div>
                      <div>Packages: <strong>{orderData.packaging_records[0].number_of_packages} pkgs</strong> @ {orderData.packaging_records[0].weight_per_package_kg} KG</div>
                      <div>Batch: <strong style={{ fontFamily: 'monospace' }}>{orderData.packaging_records[0].batch_number}</strong></div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      Vacuum packaging and airtight aroma-sealing in preparation.
                    </div>
                  )}
                </div>

                {/* Card 4: Carrier & Logistics Tracking */}
                <div style={{ backgroundColor: '#F8FAF8', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F5A2C', fontWeight: 800, fontSize: '0.85rem' }}>
                      <Truck size={17} color="#0F5A2C" /> Freight &amp; Tracking
                    </div>
                    {orderData.shipments?.length > 0 ? (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#DCFCE7', color: '#166534', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        {orderData.shipments[0].status}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', backgroundColor: '#F1F5F9', color: '#64748B', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        Freight Dispatch
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                    <div>Carrier: <strong style={{ color: '#0F172A' }}>{orderData.carrier || 'Freight Forwarder'}</strong></div>
                    <div>Tracking: <strong style={{ color: '#0284C7', fontFamily: 'monospace' }}>{orderData.tracking_number}</strong></div>
                    <div>Method: <strong>{orderData.shipping_method}</strong></div>
                    <div>Origin: <strong>{orderData.origin_port}</strong></div>
                  </div>
                </div>
              </div>

              {/* Export Documents Checklist */}
              {orderData.documents && orderData.documents.length > 0 && (
                <div style={{ padding: '0 28px 24px' }}>
                  <div style={{ backgroundColor: '#F5F3FF', borderRadius: '12px', padding: '16px', border: '1px solid #DDD6FE' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6D28D9', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <FileText size={16} /> Verified Export Documents ({orderData.documents.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {orderData.documents.map(d => (
                        <div key={d.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #C4B5FD', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', color: '#4C1D95', fontWeight: 600 }}>
                          📄 {d.document_type} {d.document_number ? `(${d.document_number})` : ''} &bull; <span style={{ color: '#16A34A' }}>Verified</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================================
                STAGE 2B: ARRIVED / DELIVERED — DELIVERY REVIEW FORM
                ========================================================================= */}
            {isDeliveryReviewStage && !confirmationResult && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                  border: '2px solid #16A34A',
                  overflow: 'hidden',
                }}
              >
                <div style={{ background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)', color: '#FFF', padding: '20px 28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={24} />
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                        Shipment Arrived! Please Review Delivery Condition
                      </h2>
                      <div style={{ fontSize: '0.85rem', color: '#DCFCE7', marginTop: '2px' }}>
                        Your cardamom export cargo has reached {orderData.destination_port}. Please inspect the parcels and confirm receipt.
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
                  {submitError && (
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: '#991B1B',
                        fontSize: '0.9rem',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <AlertCircle size={20} />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Quantity Received */}
                  <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="qtyDelivered" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                      1. Actual Net Quantity Received (KG) <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', maxWidth: '300px' }}>
                      <input
                        id="qtyDelivered"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={quantityReceived}
                        onChange={(e) => setQuantityReceived(e.target.value)}
                        style={{ width: '100%', padding: '12px 50px 12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '1rem', fontWeight: 700 }}
                      />
                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontWeight: 800, fontSize: '0.85rem' }}>KG</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                      Ordered Quantity: <strong>{orderData.quantity_kg} KG</strong>. If shortages occurred, enter actual net weight.
                    </div>
                  </div>

                  {/* Delivery Condition */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                      2. Delivery Condition <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: '10px', border: deliveryCondition === 'GOOD' ? '2px solid #16A34A' : '1px solid #CBD5E1', backgroundColor: deliveryCondition === 'GOOD' ? '#F0FDF4' : '#FFF', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>Good Condition</span>
                          <input type="radio" name="deliveryCondition" value="GOOD" checked={deliveryCondition === 'GOOD'} onChange={e => setDeliveryCondition(e.target.value)} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Aroma, seals, and packaging in intact condition.</span>
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: '10px', border: deliveryCondition === 'PARTIAL' ? '2px solid #D97706' : '1px solid #CBD5E1', backgroundColor: deliveryCondition === 'PARTIAL' ? '#FFFBEB' : '#FFF', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: '#92400E', fontSize: '0.9rem' }}>Partial / Shortage</span>
                          <input type="radio" name="deliveryCondition" value="PARTIAL" checked={deliveryCondition === 'PARTIAL'} onChange={e => setDeliveryCondition(e.target.value)} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#78350F' }}>Delivered quantity less than invoiced.</span>
                      </label>

                      <label style={{ display: 'flex', flexDirection: 'column', padding: '14px', borderRadius: '10px', border: deliveryCondition === 'DAMAGED' ? '2px solid #DC2626' : '1px solid #CBD5E1', backgroundColor: deliveryCondition === 'DAMAGED' ? '#FEF2F2' : '#FFF', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: '#991B1B', fontSize: '0.9rem' }}>Damaged Cargo</span>
                          <input type="radio" name="deliveryCondition" value="DAMAGED" checked={deliveryCondition === 'DAMAGED'} onChange={e => setDeliveryCondition(e.target.value)} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#7F1D1D' }}>Packaging torn or moisture exposure observed.</span>
                      </label>
                    </div>
                  </div>

                  {/* Observations */}
                  <div style={{ marginBottom: '24px' }}>
                    <label htmlFor="commentsDel" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      3. Observations / Comments {deliveryCondition !== 'GOOD' && <span style={{ color: '#DC2626' }}>*</span>}
                    </label>
                    <textarea
                      id="commentsDel"
                      rows={3}
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      placeholder="Notes regarding cargo quality, seal condition, or damage notes..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    />
                  </div>

                  {/* File Upload */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      4. Goods Photos / Delivery Note (Optional)
                    </label>
                    <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} />
                    {fileError && <div style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '4px' }}>{fileError}</div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        backgroundColor: submitting ? '#94A3B8' : '#16A34A',
                        color: '#FFF',
                        padding: '12px 30px',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>{submitting ? 'Submitting Review...' : 'Submit Delivery Review & Confirm Receipt'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* =========================================================================
                STAGE 2C: DELIVERY CONFIRMED — CERTIFIED DELIVERY RECEIPT
                ========================================================================= */}
            {isDeliveryConfirmedStage && (
              <div
                id="printable-receipt"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                  border: '1px solid #86EFAC',
                  padding: '30px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      CERTIFIED DELIVERY RECEIPT
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#073B1E', fontFamily: 'monospace' }}>
                      {confirmationResult?.confirmation_reference || `CONF-${orderData.order_code}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '0.35rem 0.8rem', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                      ✓ {confirmationResult?.condition_display || 'Received in Good Condition'}
                    </span>
                    <button
                      type="button"
                      onClick={handlePrint}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0F5A2C',
                        color: '#FFF',
                        border: 'none',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Printer size={15} /> Print Certificate
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: '#64748B' }}>Order Code</div>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{orderData.order_code}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B' }}>Confirmed Quantity</div>
                    <div style={{ fontWeight: 800, color: '#16A34A', marginTop: '2px' }}>
                      {confirmationResult?.quantity_received_kg || orderData.quantity_kg} KG
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B' }}>Receipt Date</div>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                      {confirmationResult?.confirmed_at ? new Date(confirmationResult.confirmed_at).toLocaleString() : new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B' }}>Destination Port</div>
                    <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                      {orderData.destination_port}, {orderData.destination_country}
                    </div>
                  </div>
                </div>

                {confirmationResult?.comments && (
                  <div style={{ marginTop: '16px', backgroundColor: '#F8FAF8', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.82rem', fontStyle: 'italic', color: '#334155' }}>
                    "{confirmationResult.comments}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748B',
          marginTop: 'auto',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <p>© {new Date().getFullYear()} CardaLink Plantation &amp; Export Management System. All rights reserved.</p>
          <p style={{ marginTop: '4px', fontSize: '0.75rem', color: '#94A3B8' }}>
            Live tracking and cryptographically signed delivery receipts powered by CardaLink Global Export Protocol.
          </p>
        </div>
      </footer>
    </div>
  );
};
