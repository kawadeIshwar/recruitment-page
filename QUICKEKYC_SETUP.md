# QuickeKYC Integration Setup Guide

## Overview
Your recruitment platform now supports **real-time GST and PAN verification** with automatic business details auto-fill using the QuickeKYC API.

When users enter their GST or PAN number during account creation, the system will:
- ✅ Verify the number with QuickeKYC API
- ✅ Auto-fill company name
- ✅ Auto-fill business type (Private Ltd, Partnership, Proprietorship, LLP)
- ✅ Auto-fill registered address
- ✅ Lock these fields to prevent manual editing (ensuring data integrity)

---

## Setup Instructions

### 1. Get Your QuickeKYC API Key

1. Visit [https://quickekyc.com](https://quickekyc.com)
2. Sign up for an account
3. Navigate to your dashboard and generate an API key
4. Copy your API key

### 2. Configure Backend Environment

1. Navigate to the `server` directory
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and update the following:
   ```env
   # QuickeKYC API Configuration
   KYC_BASE_URL=https://api.quickekyc.com/api/v1
   KYC_API_KEY=your-actual-quickekyc-api-key-here
   KYC_DEBUG=false  # Set to true for detailed API logs
   ```

### 3. API Endpoints Used

The integration uses these QuickeKYC endpoints:

#### GST Verification
- **Endpoint**: `POST https://api.quickekyc.com/api/v1/corporate/gstin`
- **Request Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "id_number": "22ABCDE1234F1Z5",
    "filing_status_get": true
  }
  ```

#### PAN Validation
- **Endpoint**: `POST https://api.quickekyc.com/api/v1/pan/pan`
- **Request Body**:
  ```json
  {
    "key": "YOUR_API_KEY",
    "id_number": "ABCDE1234F"
  }
  ```

### 4. Frontend Configuration

The frontend is already configured. Ensure your client environment variable is set:

**File**: `client/.env` or `client/.env.local`
```env
VITE_API_BASE_URL=http://localhost:4000
```

For production:
```env
VITE_API_BASE_URL=https://your-api-domain.com
```

---

## How It Works

### User Flow

1. User navigates to **Step 2: Business Details** in account creation
2. User selects either **GST** or **PAN** verification method
3. User enters their GST/PAN number
4. User clicks **"Verify"** button
5. System calls backend API → backend calls QuickeKYC
6. On successful verification:
   - ✅ **Company Name** auto-fills
   - ✅ **Business Type** auto-fills and dropdown locks
   - ✅ **Registered Address** displays (read-only)
   - ✅ Green "Verified" badge appears
   - ✅ User can proceed to next step

### Backend Architecture

```
Frontend (React)
    ↓ POST /verification/business/verify
Backend (Express)
    ↓ verifyBusiness(type, id)
KYC Service (kyc.js)
    ↓ POST https://api.quickekyc.com/api/v1/...
QuickeKYC API
    ↓ Response
Backend processes & normalizes data
    ↓
Frontend auto-fills form fields
```

### Response Parsing & Normalization

The backend intelligently maps various API response formats:

**Company Name** - Checks for:
- `legal_name`, `trade_name`, `company_name`, `name`, `full_name`

**Business Type** - Maps to frontend values:
- API: `"Private Limited Company"` → Frontend: `"Private Ltd"`
- API: `"Partnership"` → Frontend: `"Partnership"`
- API: `"Proprietorship"` → Frontend: `"Proprietorship"`
- API: `"Limited Liability Partnership"` → Frontend: `"LLP"`

**Address** - Handles both string and object formats:
- Parses nested address objects (building, street, city, state, pincode)
- Falls back to `principalPlaceOfBusiness` or `registeredAddress`

---

## Testing

### Test GST Number Format
- **Valid Format**: `22ABCDE1234F1Z5` (15 characters)
- **Pattern**: `[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]`

### Test PAN Number Format
- **Valid Format**: `ABCDE1234F` (10 characters)
- **Pattern**: `[A-Z]{5}[0-9]{4}[A-Z]`

### Enable Debug Mode
Set `KYC_DEBUG=true` in your `.env` file to see detailed API request/response logs:

```bash
[KYC DEBUG] Request
→ Endpoint: https://api.quickekyc.com/api/v1/corporate/gstin
→ Type: GST
→ Headers: { 'Content-Type': 'application/json' }
→ Body: { key: '****MASKED****', id_number: '22ABCDE1234F1Z5', filing_status_get: true }

[KYC DEBUG] Response
→ Status: 200
→ Raw Body: {...}
```

---

## Error Handling

The system handles various error scenarios:

| Error | Status | Message |
|-------|--------|---------|
| Invalid API Key | 401 | "KYC authentication failed – invalid API key or access denied" |
| GST/PAN Not Found | 404 | "GST/PAN number not found" |
| Network Timeout | 502 | "KYC service request timeout" (30s timeout) |
| Invalid Format | 400 | "Invalid GST/PAN format" |
| Service Down | 502 | "KYC service unreachable" |

---

## Security Features

✅ **Rate Limiting**: 100 requests per 15 minutes per IP  
✅ **API Key Protection**: Never exposed to frontend  
✅ **CORS Protection**: Configured origins only  
✅ **Input Validation**: Regex validation on both frontend and backend  
✅ **Data Locking**: Auto-filled fields are locked to prevent tampering  

---

## Production Checklist

- [ ] QuickeKYC API key added to production `.env`
- [ ] `KYC_DEBUG=false` in production
- [ ] Frontend `VITE_API_BASE_URL` points to production API
- [ ] CORS origins configured for production domain
- [ ] Rate limiting configured appropriately
- [ ] SSL/HTTPS enabled on API server
- [ ] Error monitoring set up (e.g., Sentry)
- [ ] API usage limits checked with QuickeKYC

---

## Troubleshooting

### Issue: "KYC service is not configured"
**Solution**: Ensure `KYC_BASE_URL` and `KYC_API_KEY` are set in `.env`

### Issue: "Invalid API key"
**Solution**: 
1. Verify API key is correct in `.env`
2. Check API key is active in QuickeKYC dashboard
3. Ensure no extra spaces or quotes in `.env` value

### Issue: "Network error"
**Solution**:
1. Check internet connectivity
2. Verify `KYC_BASE_URL=https://api.quickekyc.com` (no trailing slash)
3. Check firewall/proxy settings

### Issue: Business fields not auto-filling
**Solution**:
1. Enable `KYC_DEBUG=true` to see API response
2. Check if API returns expected field names
3. Verify normalizeBusinessType() logic in `kyc.js`

---

## API Response Examples

### GST Response Sample
```json
{
  "legal_name": "ACME PRIVATE LIMITED",
  "trade_name": "ACME",
  "constitution_of_business": "Private Limited Company",
  "address": {
    "building": "123 Business Tower",
    "street": "MG Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "gst_status": "Active",
  "registration_date": "2020-01-15"
}
```

### PAN Response Sample
```json
{
  "name": "ACME PRIVATE LIMITED",
  "type": "Company",
  "status": "Valid"
}
```

---

## Support

For QuickeKYC API issues:
- Documentation: [https://quickekyc.com/docs](https://quickekyc.com/docs)
- Support: Contact QuickeKYC support team

For integration issues:
- Check server logs with `KYC_DEBUG=true`
- Review backend at `server/src/services/kyc.js`
- Review frontend at `client/src/components/ProgressiveCreateAccount.jsx`
