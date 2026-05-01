import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { User, Lock, Save } from 'lucide-react'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState({ name: user?.name || '', company: user?.company || '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  const profileMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (res) => { updateUser(res.data.user); toast.success('Profile updated') }
  })
  const passwordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => { toast.success('Password changed'); setPasswords({ currentPassword: '', newPassword: '', confirm: '' }) },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed')
  })

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match')
    passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
  }

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Profile</h3>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            <span className={`badge mt-1 ${user?.role === 'admin' ? 'badge-red' : user?.plan === 'pro' ? 'badge-purple' : 'badge-gray'}`}>{user?.role}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Full name</label><input className="input" value={profile.name} onChange={e => setProfile(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Company</label><input className="input" value={profile.company} onChange={e => setProfile(p=>({...p,company:e.target.value}))} /></div>
        </div>
        <div><label className="label">Email</label><input className="input opacity-60" value={user?.email} disabled /></div>
        <button onClick={() => profileMutation.mutate(profile)} disabled={profileMutation.isLoading} className="btn-primary">
          <Save className="w-4 h-4" /> Save profile
        </button>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Change password</h3>
        </div>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div><label className="label">Current password</label><input className="input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p=>({...p,currentPassword:e.target.value}))} required /></div>
          <div><label className="label">New password</label><input className="input" type="password" value={passwords.newPassword} onChange={e => setPasswords(p=>({...p,newPassword:e.target.value}))} required minLength={6} /></div>
          <div><label className="label">Confirm new password</label><input className="input" type="password" value={passwords.confirm} onChange={e => setPasswords(p=>({...p,confirm:e.target.value}))} required /></div>
          <button type="submit" disabled={passwordMutation.isLoading} className="btn-primary">
            <Lock className="w-4 h-4" /> Update password
          </button>
        </form>
      </div>
    </div>
  )
}
