import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createEmployee, updateEmployee, getEmployees, getSections, getCustomFields, getProfileSections, getSectionFields } from '../../../services/api';
import { initialForm } from './constants';

export function useEmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [imagePreview, setImagePreview] = useState(null);
  const [sections, setSections] = useState([]);
  const [customFieldDefs, setCustomFieldDefs] = useState([]);
  const [profileSections, setProfileSections] = useState([]);
  const [sectionFields, setSectionFields] = useState([]);

  useEffect(() => {
    fetchSections();
    fetchCustomFields();
    fetchProfileSections();
    fetchSectionFields();
    if (isEdit) {
      fetchEmployee();
    }
  }, [id, isEdit]);

  const fetchSections = async () => {
    try {
      const response = await getSections();
      setSections(response.data || []);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const response = await getCustomFields();
      setCustomFieldDefs(response.data || []);
    } catch (error) {
      console.error('Failed to load custom fields:', error);
    }
  };

  const fetchProfileSections = async () => {
    try {
      const response = await getProfileSections();
      setProfileSections(response.data || []);
    } catch (error) {
      console.error('Failed to load profile sections:', error);
    }
  };

  const fetchSectionFields = async () => {
    try {
      const response = await getSectionFields();
      setSectionFields(response.data || []);
    } catch (error) {
      console.error('Failed to load section fields:', error);
    }
  };

  const fetchEmployee = async () => {
    setFetching(true);
    try {
      const response = await getEmployees({ page: 1, limit: 100 });
      const emp = response.data.employees?.find(e => String(e._id) === String(id));
      if (!emp) {
        toast.error('Error');
        navigate('/admin/employees');
        return;
      }
      setForm({
        employeeId: emp.employeeId || '',
        arabicName: emp.arabicName || '',
        englishName: emp.englishName || '',
        jobTitleAr: emp.jobTitleAr || '',
        jobTitleEn: emp.jobTitleEn || '',
        department: emp.department || '',
        phone: emp.phone || '',
        email: emp.email || '',
        address: emp.address || '',
        sector: emp.sector || '',
        hireDate: emp.hireDate || '',
        insuranceNumber: emp.insuranceNumber || '',
        age: emp.age || '',
        status: emp.status || 'active',
        notes: emp.notes || '',
        profileImage: null,
        education: emp.education || '',
        employmentStart: emp.employmentStart || '',
        languages: emp.languages || [],
        documents: emp.documents || [],
        customFields: emp.customFields || {}
      });
      if (emp.profileImage) {
        setImagePreview(emp.profileImage);
      }
    } catch (error) {
      toast.error('Error');
      navigate('/admin/employees');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomFieldChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: value }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Error');
        return;
      }
      setForm((prev) => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, profileImage: null }));
    setImagePreview(null);
  };

  const handleAddLanguage = () => {
    setForm((prev) => ({
      ...prev,
      languages: [...prev.languages, { language: '', proficiency: 'beginner' }]
    }));
  };

  const handleRemoveLanguage = (index) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const handleLanguageChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      languages: prev.languages.map((lang, i) =>
        i === index ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const handleAddDocument = () => {
    setForm((prev) => ({
      ...prev,
      documents: [...prev.documents, { name: '', file: null, uploadDate: new Date().toISOString() }]
    }));
  };

  const handleRemoveDocument = (index) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleDocumentChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index ? { ...doc, [field]: value } : doc
      )
    }));
  };

  const handleDocumentFileChange = (index, file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Error');
        return;
      }
      handleDocumentChange(index, 'file', file);
      if (!form.documents[index].name) {
        handleDocumentChange(index, 'name', file.name);
      }
    }
  };

  const calculateExperience = (startDate) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const diffInMs = now - start;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffInDays / 365);
    const remainingDaysAfterYears = diffInDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;
    return { years, months, days };
  };

  const validate = (t) => {
    const newErrors = {};

    if (!form.employeeId || !/^\d{4}$/.test(form.employeeId)) {
      newErrors.employeeId = t('invalidId');
    }
    if (!form.arabicName.trim()) {
      newErrors.arabicName = t('error');
    }
    if (!form.englishName.trim()) {
      newErrors.englishName = t('error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, t) => {
    e.preventDefault();
    if (!validate(t)) return;

    setLoading(true);
    try {
      const employeeData = {
        employeeId: form.employeeId,
        arabicName: form.arabicName,
        englishName: form.englishName,
        jobTitleAr: form.jobTitleAr,
        jobTitleEn: form.jobTitleEn,
        department: form.department,
        phone: form.phone,
        email: form.email,
        address: form.address,
        sector: form.sector,
        hireDate: form.hireDate,
        insuranceNumber: form.insuranceNumber,
        age: form.age,
        status: form.status,
        notes: form.notes,
        education: form.education,
        employmentStart: form.employmentStart,
        languages: form.languages,
        documents: form.documents,
        customFields: form.customFields
      };

      if (form.profileImage) {
        employeeData.profileImage = form.profileImage;
      }

      if (isEdit) {
        await updateEmployee(id, employeeData);
        toast.success(t('updateSuccess'));
      } else {
        await createEmployee(employeeData);
        toast.success(t('createSuccess'));
      }
      navigate('/admin/employees');
    } catch (error) {
      toast.error(error.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    fetching,
    imagePreview,
    sections,
    customFieldDefs,
    profileSections,
    sectionFields,
    isEdit,
    handleChange,
    handleCustomFieldChange,
    handleImageChange,
    removeImage,
    handleAddLanguage,
    handleRemoveLanguage,
    handleLanguageChange,
    handleAddDocument,
    handleRemoveDocument,
    handleDocumentChange,
    handleDocumentFileChange,
    calculateExperience,
    handleSubmit,
    setForm
  };
}
