import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import qrcode from 'qrcode-generator';
import { Credential } from '../types';

export const pdfService = {
  async generateCredentialPdf(credential: Credential, verifyUrl: string): Promise<void> {
    const data = credential.credential_data || {};
    const displayId = credential.credential_id || credential.id;

    const studentName = data.student_name || data.studentName || 'N/A';
    const rollNumber = data.roll_number || data.rollNumber || 'N/A';
    const course = data.course || 'N/A';
    const department = data.department || 'N/A';
    const institution = data.institution || 'Academic Institution';
    const credType = credential.credential_type || data.credential_type || 'Academic Credential';
    const issueDate = credential.issued_at
      ? new Date(credential.issued_at).toLocaleDateString()
      : credential.created_at
      ? new Date(credential.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();

    const isRevoked = credential.blockchain_status === 'REVOKED' || credential.revoked_at !== null;
    const status = isRevoked ? 'REVOKED' : credential.blockchain_status || 'PENDING';
    const txHash = credential.blockchain_tx_hash || 'N/A';

    // Generate pure SVG QR code string without HTML5 Canvas or DOM dependencies
    let qrSvgString = '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(verifyUrl);
      qr.make();
      qrSvgString = qr.createSvgTag({
        scalable: true,
        margin: 1,
      });
    } catch (err) {
      console.error('Error generating QR SVG string for PDF:', err);
    }

    let badgeBg = '#3B82F6';
    let badgeColor = '#FFFFFF';
    if (status === 'ANCHORED') {
      badgeBg = '#10B981';
    } else if (status === 'REVOKED') {
      badgeBg = '#EF4444';
    } else if (status === 'PENDING') {
      badgeBg = '#F59E0B';
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>D-SIVC Credential Certificate - ${displayId}</title>
        <style>
          @page { size: A4; margin: 0; }
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 30px;
            background-color: #0F172A;
            color: #F8FAFC;
            box-sizing: border-box;
          }
          .certificate {
            border: 3px solid #38BDF8;
            border-radius: 16px;
            padding: 28px;
            background: #1E293B;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #334155;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand {
            font-size: 26px;
            font-weight: 800;
            color: #38BDF8;
            letter-spacing: 2px;
            margin: 0;
          }
          .subtitle {
            font-size: 12px;
            color: #94A3B8;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .cert-title {
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            color: #F8FAFC;
            margin: 16px 0 20px 0;
            letter-spacing: 1px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }
          .field-box {
            background: #0F172A;
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid #334155;
          }
          .field-label {
            font-size: 10px;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .field-value {
            font-size: 13px;
            font-weight: 600;
            color: #F8FAFC;
            word-break: break-all;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            background-color: ${badgeBg};
            color: ${badgeColor};
          }
          .blockchain-section {
            border-top: 1px solid #334155;
            padding-top: 16px;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 700;
            color: #38BDF8;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }
          .verification-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #0F172A;
            padding: 16px;
            border-radius: 12px;
            border: 1px dashed #38BDF8;
          }
          .verify-text {
            flex: 1;
            padding-right: 16px;
          }
          .verify-url {
            font-size: 11px;
            color: #38BDF8;
            word-break: break-all;
            font-family: monospace;
            margin-top: 6px;
          }
          .qr-wrapper {
            width: 120px;
            height: 120px;
            background: #FFFFFF;
            padding: 6px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-wrapper svg {
            width: 100%;
            height: 100%;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #64748B;
            border-top: 1px solid #334155;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <h1 class="brand">D-SIVC</h1>
            <div class="subtitle">Decentralized Student Identity & Verifiable Credentials</div>
          </div>

          <div class="cert-title">DIGITAL STUDENT CREDENTIAL</div>

          <div class="grid">
            <div class="field-box">
              <div class="field-label">Student Name</div>
              <div class="field-value">${studentName}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Roll Number</div>
              <div class="field-value">${rollNumber}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Course / Program</div>
              <div class="field-value">${course}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Department</div>
              <div class="field-value">${department}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Institution</div>
              <div class="field-value">${institution}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Credential Type</div>
              <div class="field-value">${credType}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Credential ID</div>
              <div class="field-value" style="font-family: monospace;">${displayId}</div>
            </div>
            <div class="field-box">
              <div class="field-label">Issue Date</div>
              <div class="field-value">${issueDate}</div>
            </div>
          </div>

          <div class="field-box" style="margin-bottom: 20px;">
            <div class="field-label">Credential Status</div>
            <div style="margin-top: 4px;"><span class="status-badge">${status}</span></div>
          </div>

          <div class="blockchain-section">
            <div class="section-title">Blockchain Anchoring Verification</div>
            <div class="grid">
              <div class="field-box">
                <div class="field-label">Network</div>
                <div class="field-value">Polygon Amoy Testnet (Chain ID 80002)</div>
              </div>
              <div class="field-box">
                <div class="field-label">SHA-256 Credential Hash</div>
                <div class="field-value" style="font-family: monospace; font-size: 10px;">${credential.credential_hash || 'N/A'}</div>
              </div>
            </div>
            <div class="field-box">
              <div class="field-label">Polygon Amoy Transaction Hash</div>
              <div class="field-value" style="font-family: monospace; font-size: 10px;">${txHash}</div>
            </div>
          </div>

          <div class="verification-box">
            <div class="verify-text">
              <div class="section-title" style="margin-bottom: 4px;">Public Verification</div>
              <div style="font-size: 11px; color: #94A3B8;">
                Scan the QR code or visit the public URL to verify this credential on-chain:
              </div>
              <div class="verify-url">${verifyUrl}</div>
            </div>
            ${qrSvgString ? `<div class="qr-wrapper">${qrSvgString}</div>` : ''}
          </div>

          <div class="footer">
            D-SIVC Blockchain Credential System • SHA-256 Immutable Proof • Independently Verifiable
          </div>
        </div>
      </body>
    </html>
    `;

    if (Platform.OS === 'web') {
      await Print.printAsync({ html: htmlContent });
    } else {
      // 1. Generate PDF file via expo-print
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // 2. Prepare clean target path in FileSystem.cacheDirectory for FileProvider access
      const safeId = displayId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetUri = `${FileSystem.cacheDirectory}DSIVC_Credential_${safeId}.pdf`;

      // 3. Copy file to cacheDirectory
      await FileSystem.copyAsync({
        from: uri,
        to: targetUri,
      });

      // 4. Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(targetUri);
      if (!fileInfo.exists) {
        throw new Error(`Failed to copy PDF file to ${targetUri}`);
      }

      // 5. Share via expo-sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download D-SIVC Credential PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        console.warn('Sharing is not available on this device');
      }
    }
  },
};
