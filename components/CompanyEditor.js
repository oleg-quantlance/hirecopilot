'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { InputField } from './InputField';
import { Button } from './Button';
import { updateDoc, doc } from 'firebase/firestore';
import { db, storage } from '@/utils/firebaseClient';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CompanyEditor({ company, onClose }) {
  const [form, setForm] = useState({ ...company });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(company.logoUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(logoFile);
    }
  }, [logoFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = form.logoUrl;

      if (logoFile) {
        const storageRef = ref(storage, `company-logos/${company.id}-${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
      }

      const updateRef = doc(db, 'companies', company.id);
      await updateDoc(updateRef, { ...form, logoUrl });

      onClose(); // close dialog
    } catch (err) {
      console.error('Error updating company:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white max-w-3xl w-[70vw] max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6"
          onInteractOutside={(e) => e.preventDefault()} // prevent outside close
        >
          <Dialog.Title className="text-xl font-semibold mb-4">Edit Company</Dialog.Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Company Name" name="name" value={form.name} onChange={handleChange} required />
            <InputField label="Website" name="website" value={form.website} onChange={handleChange} />
            <InputField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
            <InputField label="Street" name="street" value={form.street} onChange={handleChange} />
            <InputField label="City" name="city" value={form.city} onChange={handleChange} />
            <InputField label="ZIP" name="zip" value={form.zip} onChange={handleChange} />
            <InputField label="Country" name="country" value={form.country} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Logo <span className="text-red-500">*</span>
              </label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {logoPreview && (
                <img src={logoPreview} alt="Logo Preview" className="mt-2 h-20 object-contain rounded border" />
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <Button label="Cancel" onClick={onClose} variant="secondary" />
            <Button label="Save" onClick={handleSave} isLoading={saving} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
