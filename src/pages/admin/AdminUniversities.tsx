import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import AdminModal from '../../components/admin/AdminModal'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import type { University } from '../../components/UniversityCard'

const emptyForm = {
  name: '',
  country: '',
  city: '',
  tuitionRange: '',
  programs: '',
  description: '',
  applicationLink: '',
  active: true,
}

type FormState = typeof emptyForm

export default function AdminUniversities() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchAll = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'universities'), orderBy('createdAt', 'desc')))
      setUniversities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as University)))
    } catch {
      toast.error('Failed to load universities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const openAdd = () => {
    setForm(emptyForm)
    setEditId(null)
    setModal('add')
  }

  const openEdit = (u: University) => {
    setForm({
      name: u.name,
      country: u.country,
      city: u.city,
      tuitionRange: u.tuitionRange,
      programs: u.programs.join(', '),
      description: u.description,
      applicationLink: u.applicationLink,
      active: u.active,
    })
    setEditId(u.id)
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setEditId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        country: form.country.trim(),
        city: form.city.trim(),
        tuitionRange: form.tuitionRange.trim(),
        programs: form.programs.split(',').map((p) => p.trim()).filter(Boolean),
        description: form.description.trim(),
        applicationLink: form.applicationLink.trim(),
        active: form.active,
      }
      if (modal === 'add') {
        await addDoc(collection(db, 'universities'), { ...data, createdAt: serverTimestamp() })
        toast.success('University added!')
      } else if (editId) {
        await updateDoc(doc(db, 'universities', editId), data)
        toast.success('University updated!')
      }
      closeModal()
      fetchAll()
    } catch {
      toast.error('Failed to save university')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'universities', id))
      toast.success('University deleted')
      setDeleteId(null)
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="admin-label">{label}</label>
      {children}
    </div>
  )

  return (
    <AdminLayout title="Universities">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500">{universities.length} universit{universities.length !== 1 ? 'ies' : 'y'} total</p>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-5 w-5" />
          Add University
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : universities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No universities yet. Click "Add University" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Location</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Tuition</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {universities.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name}</div>
                      {u.programs.length > 0 && (
                        <div className="text-xs text-slate-400">{u.programs.slice(0, 2).join(', ')}{u.programs.length > 2 ? '...' : ''}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.city}, {u.country}</td>
                    <td className="px-4 py-3 text-slate-600">{u.tuitionRange}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={u.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <AdminModal
          title={modal === 'add' ? 'Add University' : 'Edit University'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label">Name *</label>
              <input className="admin-input" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="admin-label">Country *</label>
                <input className="admin-input" value={form.country} required onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">City *</label>
                <input className="admin-input" value={form.city} required onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <Field label="Tuition Range (e.g. $3,000 - $8,000/year)">
              <input className="admin-input" value={form.tuitionRange} onChange={(e) => setForm({ ...form, tuitionRange: e.target.value })} placeholder="$3,000 - $8,000/year" />
            </Field>
            <Field label="Programs (comma-separated)">
              <input className="admin-input" value={form.programs} onChange={(e) => setForm({ ...form, programs: e.target.value })} placeholder="e.g. Engineering, Medicine, Business" />
            </Field>
            <Field label="Description *">
              <textarea className="admin-input resize-none" rows={3} value={form.description} required onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Application / Info Link">
              <input className="admin-input" type="url" value={form.applicationLink} onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} placeholder="https://..." />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-medium text-slate-700">Active (visible on site)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {modal === 'add' ? 'Add University' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <AdminModal title="Delete University" onClose={() => setDeleteId(null)}>
          <p className="text-slate-600 mb-6">Are you sure you want to delete this university? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleDelete(deleteId)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </AdminModal>
      )}
    </AdminLayout>
  )
}
