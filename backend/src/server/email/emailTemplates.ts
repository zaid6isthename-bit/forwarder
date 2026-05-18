export interface RFQData {
  referenceId: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: number;
  dimensions: string;
  declaredValue?: number;
  incoterms: string;
  mode: string;
  readyDate: string;
  specialInstructions?: string;
  deadline?: string;
}

export function generateRFQSubject(rfq: RFQData): string {
  return `Freight Quotation Request – ${rfq.referenceId} | ${rfq.origin} to ${rfq.destination}`;
}

export function generateRFQEmailHtml(rfq: RFQData, recipientName: string, recipientCompany: string, senderName: string, senderEmail: string): string {
  const formattedWeight = new Intl.NumberFormat('en-US').format(rfq.weight);
  const formattedValue = rfq.declaredValue 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(rfq.declaredValue) 
    : 'N/A';

  const formattedDeadline = rfq.deadline 
    ? new Date(rfq.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'ASAP';

  const formattedReadyDate = rfq.readyDate 
    ? new Date(rfq.readyDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'ASAP';

  const specialInstructionsRow = rfq.specialInstructions
    ? `<tr>
        <td class="label">Special Instructions</td>
        <td class="value font-warning">${rfq.specialInstructions}</td>
       </tr>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Freight Quotation Request</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #FFF8F0;
      color: #332211;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FFF8F0;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #FFE5CC;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.04);
    }
    .header {
      background-color: #F97316;
      padding: 24px 30px;
      text-align: center;
    }
    .logo-text {
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1px;
      margin: 0;
      text-transform: uppercase;
    }
    .subtitle {
      color: #FFE5CC;
      font-size: 11px;
      font-weight: 600;
      margin: 4px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .content {
      padding: 35px 30px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1C1009;
      margin-bottom: 12px;
    }
    .intro-text {
      font-size: 14px;
      line-height: 1.6;
      color: #4B3A2A;
      margin-top: 0;
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #EA580C;
      text-transform: uppercase;
      margin: 25px 0 10px 0;
      letter-spacing: 1px;
      border-bottom: 2px solid #FFF1E0;
      padding-bottom: 6px;
    }
    .table-responsive {
      width: 100%;
      margin-bottom: 25px;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #FFF1E0;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
    }
    .detail-table td {
      padding: 10px 14px;
      font-size: 13px;
      border-bottom: 1px solid #FFF1E0;
    }
    .detail-table tr:last-child td {
      border-bottom: none;
    }
    .detail-table td.label {
      font-weight: 600;
      color: #1C1009;
      width: 40%;
      background-color: #FFFBF5;
    }
    .detail-table td.value {
      color: #4B3A2A;
    }
    .detail-table td.value strong {
      color: #1C1009;
    }
    .font-warning {
      color: #D97706 !important;
      font-style: italic;
    }
    .cta-box {
      background-color: #FFFBF5;
      border: 1px dashed #F97316;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .cta-title {
      margin-top: 0;
      margin-bottom: 10px;
      color: #F97316;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-text {
      font-size: 13px;
      color: #4B3A2A;
      margin-top: 0;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .instruction-list {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #4B3A2A;
      line-height: 1.6;
    }
    .instruction-list li {
      margin-bottom: 6px;
    }
    .deadline-badge {
      background-color: #FFE5CC;
      color: #C2410C;
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 4px;
      margin-top: 15px;
    }
    .signature {
      font-size: 13px;
      line-height: 1.5;
      color: #8C7560;
      margin-top: 30px;
      border-top: 1px solid #FFE5CC;
      padding-top: 15px;
    }
    .footer {
      background-color: #FFFBF5;
      border-top: 1px solid #FFE5CC;
      padding: 20px 30px;
      text-align: center;
      font-size: 11px;
      color: #8C7560;
      line-height: 1.5;
    }
    .footer a {
      color: #F97316;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">FreightBid Logistics</div>
        <div class="subtitle">Procurement & RFQ Network</div>
      </div>
      
      <div class="content">
        <div class="greeting">Dear ${recipientName},</div>
        <p class="intro-text">
          We have registered a new shipment in our procurement network. On behalf of <strong>${senderName}</strong>, we are cordially inviting <strong>${recipientCompany}</strong> to submit your most competitive commercial quotation for the shipment detailed below.
        </p>
        
        <div class="section-title">Shipment Specifications</div>
        <div class="table-responsive">
          <table class="detail-table">
            <tr>
              <td class="label">Reference ID</td>
              <td class="value"><strong>${rfq.referenceId}</strong></td>
            </tr>
            <tr>
              <td class="label">Origin</td>
              <td class="value">${rfq.origin}</td>
            </tr>
            <tr>
              <td class="label">Destination</td>
              <td class="value">${rfq.destination}</td>
            </tr>
            <tr>
              <td class="label">Shipment Mode</td>
              <td class="value">${rfq.mode} Freight</td>
            </tr>
            <tr>
              <td class="label">Cargo Type</td>
              <td class="value">${rfq.cargoType}</td>
            </tr>
            <tr>
              <td class="label">Weight</td>
              <td class="value">${formattedWeight} kg</td>
            </tr>
            <tr>
              <td class="label">Dimensions</td>
              <td class="value">${rfq.dimensions}</td>
            </tr>
            <tr>
              <td class="label">Declared Value</td>
              <td class="value">${formattedValue}</td>
            </tr>
            <tr>
              <td class="label">Incoterms</td>
              <td class="value">${rfq.incoterms}</td>
            </tr>
            <tr>
              <td class="label">Readiness Date</td>
              <td class="value">${formattedReadyDate}</td>
            </tr>
            ${specialInstructionsRow}
          </table>
        </div>

        <div class="cta-box">
          <div class="cta-title">Bidding Instructions</div>
          <p class="cta-text">
            Please reply directly to this email with your best quotation. Ensure your response includes the following details:
          </p>
          <ol class="instruction-list">
            <li><strong>All-Inclusive Freight Pricing:</strong> Net rates including basic freight, standard surcharges, and local fees.</li>
            <li><strong>Transit Time:</strong> Estimated transit days and schedule availability (carrier / route).</li>
            <li><strong>Terms & Exclusions:</strong> Any specific terms, cargo validity limits, or required loading notes.</li>
          </ol>
          <div class="deadline-badge">
            Response Deadline: ${formattedDeadline}
          </div>
        </div>

        <div class="signature">
          Warm regards,<br>
          <strong>FreightBid Logistics Network</strong><br>
          <span style="font-size: 11px;">Automated RFQ Coordination Portal</span>
        </div>
      </div>
      
      <div class="footer">
        This is an operational transaction message sent to pre-approved logistics suppliers.<br>
        Issued by ${senderName} (<a href="mailto:${senderEmail}">${senderEmail}</a>).<br>
        &copy; ${new Date().getFullYear()} FreightBid Inc. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;
}
