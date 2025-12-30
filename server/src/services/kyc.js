import fetch from 'node-fetch'

const DEBUG = process.env.KYC_DEBUG === 'true'

export const verifyBusiness = async (type, id) => {
  if (DEBUG) {
    console.log('[KYC] Environment Check:')
    console.log('→ KYC_BASE_URL:', process.env.KYC_BASE_URL ? '✓ Set' : '✗ Missing')
    console.log('→ KYC_API_KEY:', process.env.KYC_API_KEY ? `✓ Set (length: ${process.env.KYC_API_KEY.length})` : '✗ Missing')
  }
  
  if (!process.env.KYC_BASE_URL || !process.env.KYC_API_KEY) {
    throw new Error('KYC service is not configured')
  }

  if (!['GST', 'PAN'].includes(type)) {
    throw new Error('Invalid verification type')
  }

  const baseUrl = process.env.KYC_BASE_URL

  // ✅ Correct endpoints as per QuickeKYC docs
  const endpoint =
    type === 'GST'
      ? `${baseUrl}/corporate/gstin`
      : `${baseUrl}/pan/pan`

  const headers = {
    'Content-Type': 'application/json'
  }

  // ✅ Correct request body per API
  const body =
    type === 'GST'
      ? {
          key: process.env.KYC_API_KEY,
          id_number: id,
          filing_status_get: true
        }
      : {
          key: process.env.KYC_API_KEY,
          id_number: id
        }

  if (DEBUG) {
    console.log('[KYC DEBUG] Request')
    console.log('→ Endpoint:', endpoint)
    console.log('→ Type:', type)
    console.log('→ Headers:', JSON.stringify(headers))
    console.log('→ Body:', JSON.stringify(body))
    console.log('→ API Key (first 8 chars):', process.env.KYC_API_KEY.substring(0, 8) + '...')
    console.log('→ ID Number:', id)
  }

  let resp
  let rawText

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    rawText = await resp.text()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('KYC service request timeout')
    }
    throw new Error('KYC service unreachable')
  }

  if (DEBUG) {
    console.log('[KYC DEBUG] Response')
    console.log('→ Status:', resp.status)
    console.log('→ Status Text:', resp.statusText)
    console.log('→ Raw Body:', rawText)
  }

  if (resp.status === 401 || resp.status === 403) {
    throw new Error('KYC authentication failed – invalid API key or access denied')
  }

  if (resp.status === 404) {
    throw new Error(`${type} number not found`)
  }

  if (!resp.ok) {
    let msg = `KYC verification failed (${resp.status})`
    try {
      const errJson = JSON.parse(rawText)
      msg = errJson.message || errJson.error || msg
    } catch {}
    throw new Error(msg)
  }

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('Invalid JSON response from KYC provider')
  }

  const data =
    parsed.result ||
    parsed.data ||
    parsed.response ||
    parsed.body ||
    parsed

  if (DEBUG) {
    console.log('[KYC DEBUG] Full API Response Data:')
    console.log(JSON.stringify(data, null, 2))
  }

  const formattedAddress = formatAddress(data)
  if (DEBUG) {
    console.log('[KYC DEBUG] Formatted Address:', formattedAddress)
  }

  return {
    verified: true,
    verificationSource: 'quickekyc',
    verificationType: type,
    companyName:
      data.legal_name ||
      data.trade_name ||
      data.legalName ||
      data.tradeName ||
      data.company_name ||
      data.companyName ||
      data.name ||
      data.full_name ||
      data.fullName ||
      '',
    businessType: normalizeBusinessType(
      data.constitution_of_business ||
      data.constitutionOfBusiness ||
      data.business_type ||
      data.businessType ||
      data.type ||
      data.entity_type ||
      data.entityType ||
      ''
    ),
    address: formattedAddress,
    gstStatus: data.gst_status || data.status || data.gstin_status || '',
    registrationDate:
      data.registration_date ||
      data.dateOfRegistration ||
      data.date_of_registration ||
      ''
  }
}

function normalizeBusinessType(rawType) {
  if (!rawType) return ''
  
  const normalized = rawType.toLowerCase().trim()
  
  // Map various API responses to frontend businessType values
  // Frontend expects: 'Private Ltd', 'Partnership', 'Proprietorship', 'LLP', 'Other'
  if (normalized.includes('private') && normalized.includes('limit')) {
    return 'Private Ltd'
  }
  if (normalized.includes('partnership')) {
    return 'Partnership'
  }
  if (normalized.includes('proprietor') || normalized.includes('proprietorship')) {
    return 'Proprietorship'
  }
  if (normalized.includes('llp') || normalized.includes('limited liability partnership')) {
    return 'LLP'
  }
  if (normalized.includes('public') && normalized.includes('limit')) {
    return 'Private Ltd' // Fallback to Private Ltd
  }
  
  // Return original if no match (will be treated as 'Other')
  return rawType
}

function formatAddress(data) {
  if (DEBUG) {
    console.log('[KYC DEBUG] formatAddress called with data keys:', Object.keys(data))
  }
  
  if (typeof data.address === 'string') {
    if (DEBUG) console.log('[KYC DEBUG] Address is string:', data.address)
    return data.address
  }

  if (data.address && typeof data.address === 'object') {
    if (DEBUG) console.log('[KYC DEBUG] Address object:', JSON.stringify(data.address, null, 2))
    const formatted = [
      data.address.building,
      data.address.bno,
      data.address.bnm,
      data.address.building_name,
      data.address.building_no,
      data.address.street,
      data.address.st,
      data.address.strd,
      data.address.locality,
      data.address.loc,
      data.address.city,
      data.address.dst,
      data.address.district,
      data.address.state,
      data.address.stcd,
      data.address.pincode,
      data.address.pncd,
      data.address.country
    ]
      .filter(Boolean)
      .join(', ')
    
    if (formatted) {
      if (DEBUG) console.log('[KYC DEBUG] Formatted from address object:', formatted)
      return formatted
    }
  }

  // Try other address field variations
  const fallbackAddress = 
    data.principalPlaceOfBusiness ||
    data.principal_place_of_business ||
    data.pradr ||
    data.pradr?.addr ||
    data.registeredAddress ||
    data.registered_address ||
    data.address_line1 ||
    data.addressLine1 ||
    ''
  
  if (DEBUG) console.log('[KYC DEBUG] Fallback address:', fallbackAddress)
  
  return fallbackAddress || 'Address not available'
}
