// app/company/page.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '../../utils/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/InputField';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Alert } from '@/components/Alert';
import { motion } from 'framer-motion';

export default function CompanyProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    logoFile: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && (u.emailVerified || u.isInvited)) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        const userData = userDoc.data();
        if (!userData || userData.role !== 'Administrator' || userData.companyId !== '__pending__') {
          router.push('/dashboard');
        } else {
          setUser({ ...u, uid: u.uid });
        }
      } else {
        console.log('✅ Going to verify email:', user);
        router.push('/verify-email');
      }
    });
    return () => unsub();
  }, [router]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logoFile') {
      setForm({ ...form, logoFile: files[0] });
    } else if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      const formatted = digits.replace(/(\d{0,3})(\d{0,3})(\d{0,4})/, (m, p1, p2, p3) => {
        return `${p1 ? `(${p1}` : ''}${p2 ? `) ${p2}` : ''}${p3 ? `-${p3}` : ''}`;
      });
      setForm({ ...form, phone: formatted });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const { name, phone, logoFile, state } = form;
    if (!name || !phone || !logoFile) {
      return setError('Please fill all required fields including company logo.');
    }
    if (state && !/^[A-Z]{2}$/.test(state.trim())) {
      return setError('State must be 2 uppercase letters.');
    }
    if (logoFile.size > 1024 * 1024) {
      return setError('Logo file size must be less than 1MB.');
    }
    if (!['image/png', 'image/jpeg'].includes(logoFile.type)) {
      return setError('Logo must be PNG or JPG format.');
    }

    try {
      setLoading(true);
      const companyId = doc(collection(db, 'companies')).id;
      const logoRef = ref(storage, `company_logos/${companyId}/${logoFile.name}`);

      const metadata = {
        contentType: logoFile.type,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      };

      try {
        console.log('📤 Uploading logo to:', logoRef.fullPath);
        console.log('📦 Logo File:', logoFile);
        await uploadBytes(logoRef, logoFile, metadata);
        console.log('✅ Upload complete');
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        setError('Logo upload failed. Please try again.');
        setLoading(false);
        return;
      }
      const logoUrl = await getDownloadURL(logoRef);
      console.log('✅ Uploaded logo public URL:', logoUrl);

      await setDoc(doc(db, 'companies', companyId), {
        name: form.name,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
        phone: form.phone,
        logoUrl,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', user.uid), {
        companyId,
      }, { merge: true });

      setSuccess('Company profile created successfully.');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      console.error('Error saving company:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-indigo-100 px-4">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card title="Tell us about your company">
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
          >
            <Input label="Company Name *" name="name" value={form.name} onChange={handleChange} />
            <Input label="Street" name="street" value={form.street} onChange={handleChange} />
            <Input label="City" name="city" value={form.city} onChange={handleChange} />
            <Input label="State (2-letter code)" name="state" value={form.state} onChange={handleChange} />
            <Input label="Zip Code" name="zip" value={form.zip} onChange={handleChange} />
            <Input label="Country" name="country" value={form.country} onChange={handleChange} />
            <Input label="Phone Number *" name="phone" value={form.phone} onChange={handleChange} />
            <Input label="Company Logo *" name="logoFile" type="file" accept="image/png,image/jpeg" onChange={handleChange} />

            {error && <Alert variant="error" message={error} />}
            {success && <Alert variant="success" message={success} />}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Button
                onClick={handleSubmit}
                isLoading={loading}
                label="Save and Continue"
                className="w-full text-base py-2.5"
              />
            </motion.div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
