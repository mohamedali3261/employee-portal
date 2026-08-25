const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://employee-portal.tail16a01e.ts.net/api' : '/api')
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '')

function getAuthToken() {
  return localStorage.getItem('token')
}

function setAuthToken(token) {
  if (!token || typeof token !== 'string' || token.length < 50) return
  localStorage.setItem('token', token)
}

function removeAuthToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('admin')
}

function isAdminLoggedIn() {
  const token = getAuthToken()
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    removeAuthToken()
    return false
  }
}

async function request(url, options = {}) {
  const { responseType = 'json', ...fetchOptions } = options
  const token = getAuthToken()

  // Auto-redirect on expired token
  if (token && !isAdminLoggedIn()) {
    removeAuthToken()
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login'
    }
    throw new Error('Session expired')
  }

  const headers = {
    ...fetchOptions.headers,
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${API_URL}${url}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: response.statusText }
      }

      if (response.status === 401) {
        removeAuthToken()
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login'
        }
        throw new Error(errorData.message || 'Session expired')
      }

      if (response.status === 403) {
        throw new Error('Access denied')
      }

      throw new Error(errorData.message || `Request failed`)
    }

    if (response.status === 204) {
      return null
    }

    if (responseType === 'blob') {
      return await response.blob()
    }
    return await response.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Request timeout')
    }
    throw err
  }
}

function mapEmployeeFromBackend(emp) {
  if (!emp) return null

  let languages = []
  let documents = []
  let customFields = {}
  try {
    if (emp.languages) languages = typeof emp.languages === 'string' ? JSON.parse(emp.languages) : emp.languages
  } catch { languages = [] }
  try {
    if (emp.documents) documents = typeof emp.documents === 'string' ? JSON.parse(emp.documents) : emp.documents
  } catch { documents = [] }
  try {
    if (emp.custom_fields) customFields = typeof emp.custom_fields === 'string' ? JSON.parse(emp.custom_fields) : emp.custom_fields
  } catch { customFields = {} }
  if (!customFields || typeof customFields !== 'object') customFields = {}

  return {
    _id: emp.id,
    employeeId: emp.employee_id,
    arabicName: emp.name_ar,
    englishName: emp.name_en,
    jobTitle: emp.job_title,
    jobTitleAr: emp.job_title_ar || '',
    jobTitleEn: emp.job_title_en || '',
    department: emp.department,
    email: emp.email,
    sector: emp.sector,
    hireDate: emp.hire_date,
    address: emp.address,
    phone: emp.phone,
    phone2: emp.phone2 || '',
    status: emp.status,
    notes: emp.notes,
    profileImage: emp.profile_image ? (emp.profile_image.startsWith('http') ? emp.profile_image : `${BACKEND_ORIGIN}/uploads/employees/${emp.profile_image}`) : null,
    insuranceNumber: emp.insurance_number,
    bank: emp.bank,
    bankAccount: emp.bank_account,
    attendanceBase: emp.attendance_base,
    route: emp.route,
    education: emp.education,
    graduationYear: emp.graduation_year,
    employmentStart: emp.employment_start || '',
    directManager: emp.direct_manager || '',
    certifications: (() => { try { if (!emp.certifications) return []; if (Array.isArray(emp.certifications)) return emp.certifications; if (typeof emp.certifications === 'string') { const parsed = JSON.parse(emp.certifications); return Array.isArray(parsed) ? parsed : [] } return [] } catch { return emp.certifications ? emp.certifications.split(',').map(s => s.trim()).filter(Boolean) : [] } })(),
    category: emp.category || '',
    birthdate: emp.birthdate || '',
    languages,
    documents: documents.map(d => {
      if (d.fileUrl && !d.fileUrl.startsWith('http')) d.fileUrl = `${BACKEND_ORIGIN}${d.fileUrl}`
      return d
    }),
    customFields,
    createdAt: emp.created_at,
    updatedAt: emp.updated_at,
  }
}

function mapEmployeeToBackend(data) {
  const mapped = {}
  if (data.employeeId !== undefined) mapped.employee_id = data.employeeId
  if (data.arabicName !== undefined) mapped.name_ar = data.arabicName
  if (data.englishName !== undefined) mapped.name_en = data.englishName
  if (data.jobTitle !== undefined) mapped.job_title = data.jobTitle
  if (data.jobTitleAr !== undefined) mapped.job_title_ar = data.jobTitleAr
  if (data.jobTitleEn !== undefined) mapped.job_title_en = data.jobTitleEn
  if (data.department !== undefined) mapped.department = data.department
  if (data.email !== undefined) mapped.email = data.email
  if (data.sector !== undefined) mapped.sector = data.sector
  if (data.hireDate !== undefined) mapped.hire_date = data.hireDate
  if (data.address !== undefined) mapped.address = data.address
  if (data.phone !== undefined) mapped.phone = data.phone
  if (data.phone2 !== undefined) mapped.phone2 = data.phone2
  if (data.birthdate !== undefined) mapped.birthdate = data.birthdate
  if (data.status !== undefined) mapped.status = data.status
  if (data.notes !== undefined) mapped.notes = data.notes
  if (data.insuranceNumber !== undefined) mapped.insurance_number = data.insuranceNumber
  if (data.bank !== undefined) mapped.bank = data.bank
  if (data.bankAccount !== undefined) mapped.bank_account = data.bankAccount
  if (data.attendanceBase !== undefined) mapped.attendance_base = data.attendanceBase
  if (data.route !== undefined) mapped.route = data.route
  if (data.education !== undefined) mapped.education = data.education
  if (data.graduationYear !== undefined) mapped.graduation_year = data.graduationYear
  if (data.employmentStart !== undefined) mapped.employment_start = data.employmentStart
  if (data.directManager !== undefined) mapped.direct_manager = data.directManager
  if (data.certifications !== undefined) mapped.certifications = JSON.stringify(data.certifications || [])
  if (data.category !== undefined) mapped.category = data.category
  if (data.age !== undefined) mapped.age = data.age
  if (data.languages !== undefined) mapped.languages = JSON.stringify(data.languages || [])
  if (data.documents !== undefined) mapped.documents = JSON.stringify(data.documents || [])
  if (data.customFields !== undefined) mapped.custom_fields = JSON.stringify(data.customFields || {})
  return mapped
}

export async function loginEmployee(employeeId, password) {
  const data = await request('/employee/login', {
    method: 'POST',
    body: JSON.stringify({ employee_id: employeeId, password }),
  })
  return {
    ...data,
    employee: mapEmployeeFromBackend(data.data),
    mustChangePassword: data.mustChangePassword,
  }
}

export async function changePassword(employeeId, newPassword) {
  return request('/employee/change-password', {
    method: 'POST',
    body: JSON.stringify({ employee_id: employeeId, newPassword }),
  })
}

export async function getEmployee(id) {
  const data = await request(`/employee/${encodeURIComponent(id)}`)
  return {
    ...data,
    employee: mapEmployeeFromBackend(data.data),
  }
}

export async function searchPortalEmployees(query) {
  if (!query || !query.trim()) return { success: true, data: [] }
  const data = await request(`/employee/search?q=${encodeURIComponent(query.trim())}`)
  return {
    ...data,
    data: (data.data || []).map(mapEmployeeFromBackend),
  }
}

export async function loginAdmin({ username, password, rememberMe }) {
  const data = await request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, rememberMe: !!rememberMe }),
  })
  if (data.data?.token) {
    setAuthToken(data.data.token)
    localStorage.setItem('admin', JSON.stringify(data.data.user))
  }
  return data
}

export async function getEmployees(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  const queryString = query.toString()
  const data = await request(`/admin/employees${queryString ? `?${queryString}` : ''}`)
  return {
    ...data,
    data: {
      employees: (data.data || []).map(mapEmployeeFromBackend),
      total: data.pagination?.total || 0,
      totalPages: data.pagination?.pages || 1,
      page: data.pagination?.page || 1,
    },
  }
}

export async function getEmployeesList() {
  const data = await request('/admin/employees/list')
  return data.data || []
}

export async function createEmployee(formData) {
  const dataToSend = formData instanceof FormData ? formData : null
  let body

  if (dataToSend) {
    body = dataToSend
  } else {
    const fd = new FormData()
    // Clean documents: separate File objects into individual fields
    const docs = (formData.documents || []).map((doc, i) => {
      if (doc.file instanceof File) {
        fd.append(`doc_file_${i}`, doc.file)
        const { file, ...rest } = doc
        return rest
      }
      return doc
    })
    const cleanData = { ...formData, documents: docs }
    const mapped = mapEmployeeToBackend(cleanData)
    Object.entries(mapped).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        fd.append(key, value)
      }
    })
    if (formData.profileImage instanceof File) {
      fd.append('profile_image', formData.profileImage)
    }
    if (formData.profileImageUrl) {
      fd.append('profile_image_url', formData.profileImageUrl)
    }
    body = fd
  }

  return request('/admin/employees', {
    method: 'POST',
    body,
  })
}

export async function updateEmployee(id, formData) {
  let body

  if (formData instanceof FormData) {
    body = formData
  } else {
    const fd = new FormData()
    const docs = (formData.documents || []).map((doc, i) => {
      if (doc.file instanceof File) {
        fd.append(`doc_file_${i}`, doc.file)
        const { file, ...rest } = doc
        return rest
      }
      return doc
    })
    const cleanData = { ...formData, documents: docs }
    const mapped = mapEmployeeToBackend(cleanData)
    Object.entries(mapped).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        fd.append(key, value)
      }
    })
    if (formData.profileImage instanceof File) {
      fd.append('profile_image', formData.profileImage)
    }
    if (formData.profileImageUrl) {
      fd.append('profile_image_url', formData.profileImageUrl)
    }
    body = fd
  }

  return request(`/admin/employees/${id}`, {
    method: 'PUT',
    body,
  })
}

export async function deleteEmployee(id) {
  return request(`/admin/employees/${id}`, {
    method: 'DELETE',
  })
}

export async function getDashboardStats() {
  const data = await request('/admin/dashboard/statistics')
  const stats = data.data || {}
  return {
    ...data,
    data: {
      totalEmployees: stats.totalEmployees || 0,
      activeCount: stats.activeEmployees || 0,
      inactiveCount: stats.inactiveEmployees || 0,
      totalDepartments: stats.departmentsCount || 0,
      totalBranches: stats.branchesCount || 0,
      departmentStats: stats.employeesByDepartment || [],
      branchStats: stats.employeesByBranch || [],
      recentEmployees: [],
    },
  }
}

export async function getActivityLog(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  const queryString = query.toString()
  return request(`/admin/activity-log${queryString ? `?${queryString}` : ''}`)
}

export async function importEmployees(employees) {
  return request('/admin/employees/import', {
    method: 'POST',
    body: JSON.stringify({ employees }),
  })
}

export async function getSections() {
  const data = await request('/admin/sections')
  return data
}

export async function createSection(name_en, name_ar) {
  return request('/admin/sections', {
    method: 'POST',
    body: JSON.stringify({ name_en, name_ar })
  })
}

export async function deleteSection(id) {
  return request(`/admin/sections/${id}`, {
    method: 'DELETE'
  })
}

export async function getCustomFields() {
  const data = await request('/admin/custom-fields')
  return data
}

export async function createCustomField({ name_en, name_ar, type, options, section_id }) {
  return request('/admin/custom-fields', {
    method: 'POST',
    body: JSON.stringify({ name_en, name_ar, type, options, section_id })
  })
}

export async function updateCustomField(id, { name_en, name_ar, type, options, section_id }) {
  return request(`/admin/custom-fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name_en, name_ar, type, options, section_id })
  })
}

export async function deleteCustomField(id) {
  return request(`/admin/custom-fields/${id}`, {
    method: 'DELETE'
  })
}

export async function getCustomFieldDefinitions() {
  const data = await request('/employee/custom-fields')
  return data
}

export async function getProfileSections() {
  const data = await request('/admin/profile-sections')
  return data
}

export async function createProfileSection({ name_en, name_ar, column_no }) {
  return request('/admin/profile-sections', {
    method: 'POST',
    body: JSON.stringify({ name_en, name_ar, column_no })
  })
}

export async function updateProfileSection(id, { name_en, name_ar, sort_order, column_no }) {
  return request(`/admin/profile-sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name_en, name_ar, sort_order, column_no })
  })
}

export async function deleteProfileSection(id) {
  return request(`/admin/profile-sections/${id}`, {
    method: 'DELETE'
  })
}

export async function getProfileSectionDefinitions() {
  const data = await request('/employee/profile-sections')
  return data
}

export async function getSectionFields() {
  const data = await request('/admin/section-fields')
  return data
}

export async function getBuiltinFieldCatalog() {
  const data = await request('/admin/section-fields/builtins')
  return data
}

export async function addBuiltinSectionField({ field_key, section_id }) {
  return request('/admin/section-fields', {
    method: 'POST',
    body: JSON.stringify({ field_key, section_id }),
  })
}

export async function updateSectionField(id, { name_en, name_ar, type, options, section_id, sort_order, is_visible }) {
  return request(`/admin/section-fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name_en, name_ar, type, options, section_id, sort_order, is_visible }),
  })
}

export async function deleteSectionField(id) {
  return request(`/admin/section-fields/${id}`, {
    method: 'DELETE',
  })
}

export async function getSectionFieldDefinitions() {
  const data = await request('/employee/section-fields')
  return data
}

export async function getAdminProfile() {
  return request('/admin/profile')
}

export async function updateCredentials({ currentPassword, newUsername, newPassword }) {
  const data = await request('/admin/settings/credentials', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newUsername, newPassword })
  })
  if (data.data?.token) {
    setAuthToken(data.data.token)
    localStorage.setItem('admin', JSON.stringify(data.data.user))
  }
  return data
}

export async function getAdminUsers() {
  return request('/admin/users')
}

export async function createAdminUser({ username, password, role }) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, password, role })
  })
}

export async function deleteAdminUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' })
}

export async function updateAdminUser(id, { username, password }) {
  return request(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ username, password })
  })
}

export async function resetAdminPassword(id) {
  return request(`/admin/users/${id}/reset-password`, {
    method: 'POST'
  })
}

export async function changeAdminPassword({ newPassword, confirmPassword }) {
  const data = await request('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword, confirmPassword })
  })
  if (data.data?.token) {
    setAuthToken(data.data.token)
    localStorage.setItem('admin', JSON.stringify(data.data.user))
  }
  return data
}

export async function getSecurityQuestion(username) {
  return request(`/admin/security-question?username=${encodeURIComponent(username)}`)
}

export async function forgotPassword({ username, answer, newPassword }) {
  return request('/admin/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ username, answer, newPassword }),
  })
}

export async function saveSecurityQuestion({ question, answer }) {
  return request('/admin/security-question', {
    method: 'POST',
    body: JSON.stringify({ question, answer }),
  })
}

export async function changePasswordWithSecurity({ newPassword, confirmPassword, question, answer }) {
  const data = await request('/admin/change-password-with-security', {
    method: 'POST',
    body: JSON.stringify({ newPassword, confirmPassword, question, answer }),
  })
  if (data.data?.token) {
    setAuthToken(data.data.token)
    localStorage.setItem('admin', JSON.stringify(data.data.user))
  }
  return data
}

const api = {
  employee: { loginEmployee, getEmployee, changePassword },
  admin: { loginAdmin, getEmployees, createEmployee, updateEmployee, deleteEmployee, getDashboardStats, getActivityLog, importEmployees },
  getAuthToken,
  setAuthToken,
  removeAuthToken,
}

export default api
