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
import type { Scholarship } from '../../components/ScholarshipCard'

const emptyForm = {
  name: '',
  country: '',
  hostUniversity: '',
  fundingType: 'fully-funded' as 'fully-funded' | 'partial',
  deadline: '',
  description: '',
  eligibility: '',
  applicationLink: '',
  tags: '',
  active: true,
}

type FormState = typeof emptyForm

export default function AdminScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchAll = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'scholarships'), orderBy('createdAt', 'desc')))
      setScholarships(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scholarship)))
    } catch {
      toast.error('Failed to load scholarships')
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

  const openEdit = (s: Scholarship) => {
    setForm({
      name: s.name,
      country: s.country,
      hostUniversity: s.hostUniversity,
      fundingType: s.fundingType,
      deadline: s.deadline,
      description: s.description,
      eligibility: s.eligibility,
      applicationLink: s.applicationLink,
      tags: s.tags.join(', '),
      active: s.active,
    })
    setEditId(s.id)
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
        hostUniversity: form.hostUniversity.trim(),
        fundingType: form.fundingType,
        deadline: form.deadline.trim(),
        description: form.description.trim(),
        eligibility: form.eligibility.trim(),
        applicationLink: form.applicationLink.trim(),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        active: form.active,
      }
      if (modal === 'add') {
        await addDoc(collection(db, 'scholarships'), { ...data, createdAt: serverTimestamp() })
        toast.success('Scholarship added!')
      } else if (editId) {
        await updateDoc(doc(db, 'scholarships', editId), data)
        toast.success('Scholarship updated!')
      }
      closeModal()
      fetchAll()
    } catch {
      toast.error('Failed to save scholarship')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scholarships', id))
      toast.success('Scholarship deleted')
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
    <AdminLayout title="Scholarships">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500">{scholarships.length} scholarship{scholarships.length !== 1 ? 's' : ''} total</p>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-5 w-5" />
          Add Scholarship
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : scholarships.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          No scholarships yet. Click "Add Scholarship" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Country</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Deadline</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scholarships.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.hostUniversity}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.country}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.fundingType === 'fully-funded'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.fundingType === 'fully-funded' ? 'Fully Funded' : 'Partial'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.deadline}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {s.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={s.applicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
                          title="Delete"
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
          title={modal === 'add' ? 'Add Scholarship' : 'Edit Scholarship'}
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name *">
              <input className="admin-input" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country *">
                <input className="admin-input" value={form.country} required onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </Field>
              <Field label="Funding Type">
                <select className="admin-input" value={form.fundingType} onChange={(e) => setForm({ ...form, fundingType: e.target.value as 'fully-funded' | 'partial' })}>
                  <option value="fully-funded">Fully Funded</option>
                  <option value="partial">Partial</option>
                </select>
              </Field>
            </div>
            <Field label="Host University">
              <input className="admin-input" value={form.hostUniversity} onChange={(e) => setForm({ ...form, hostUniversity: e.target.value })} />
            </Field>
            <Field label="Deadline (e.g. March 15)">
              <input className="admin-input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
            <Field label="Description *">
              <textarea className="admin-input resize-none" rows={3} value={form.description} required onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Eligibility">
              <textarea className="admin-input resize-none" rows={2} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
            </Field>
            <Field label="Application Link">
              <input className="admin-input" type="url" value={form.applicationLink} onChange={(e) => setForm({ ...form, applicationLink: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Tags (comma-separated)">
              <input className="admin-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. STEM, Postgrad, Europe" />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm font-medium text-slate-700">Active (visible on site)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {modal === 'add' ? 'Add Scholarship' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <AdminModal title="Delete Scholarship" onClose={() => setDeleteId(null)}>
          <p className="text-slate-600 mb-6">Are you sure you want to delete this scholarship? This action cannot be undone.</p>
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
