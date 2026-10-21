import {type FormEvent, useState} from "react";
import {useNavigate} from "react-router";
import Navbar from "~/components/Navbar";
import {useAuthStore} from "~/lib/auth";
import {useRequireAuth} from "~/lib/hooks";

export const meta = () => ([
    { title: 'Resumind | Account' },
    { name: 'description', content: 'Manage your account' },
])

const errorText = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong';

const Account = () => {
    const isAuthenticated = useRequireAuth();
    const { user, changePassword, deleteAccount, logout } = useAuthStore();
    const navigate = useNavigate();

    const [passwordError, setPasswordError] = useState('');
    const [passwordSaved, setPasswordSaved] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSaved('');
        const form = e.currentTarget;
        const formData = new FormData(form);
        const currentPassword = String(formData.get('current-password') || '');
        const newPassword = String(formData.get('new-password') || '');
        const confirmPassword = String(formData.get('confirm-new-password') || '');

        if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters');
        if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match');
        if (newPassword === currentPassword) return setPasswordError('New password must be different from the current one');

        const isFirstPassword = !user?.hasPassword;
        setIsSavingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            form.reset();
            setPasswordSaved(isFirstPassword
                ? 'Password set. You can now log in with your email and password, or with Google.'
                : 'Password changed. Your other devices have been logged out.');
        } catch (err) {
            setPasswordError(errorText(err));
        } finally {
            setIsSavingPassword(false);
        }
    }

    const handleDeleteAccount = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setDeleteError('');
        // Password accounts confirm with their password; Google-only accounts (no password) type their email
        const typed = String(new FormData(e.currentTarget).get('delete-confirm') || '');
        if (!confirm('Delete your account and ALL your resumes, analyses, improved resumes and cover letters? This cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await deleteAccount(user?.hasPassword ? { password: typed } : { confirmEmail: typed });
            logout();
            navigate('/', { replace: true }); // account is gone: back to the landing page
        } catch (err) {
            setDeleteError(errorText(err));
            setIsDeleting(false);
        }
    }

    if (!isAuthenticated || !user) {
        return <main className="bg-[url('/images/bg-main.svg')] bg-cover"><Navbar /></main>;
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-6 sm:py-10">
                    <h1>Your Account</h1>
                </div>

                <div className="flex flex-col gap-6 w-full max-w-2xl">
                    <section className="flex flex-col gap-2 bg-white rounded-2xl p-5 sm:p-8">
                        <h3 className="text-xl font-bold text-black">Profile</h3>
                        <p className="break-words"><span className="text-gray-500">Username:</span> {user.username}</p>
                        <p className="break-all"><span className="text-gray-500">Email:</span> {user.email}</p>
                        <p><span className="text-gray-500">Member since:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                    </section>

                    <section className="flex flex-col gap-4 bg-white rounded-2xl p-5 sm:p-8">
                        <h3 className="text-xl font-bold text-black">{user.hasPassword ? 'Change password' : 'Set a password'}</h3>
                        {!user.hasPassword && (
                            <p className="text-gray-600">
                                You signed up with Google. Set a password to also log in with your email and password.
                            </p>
                        )}
                        <form onSubmit={handleChangePassword} className="!gap-4">
                            {/* Hidden username helps password managers update the right saved login */}
                            <input type="text" name="username" autoComplete="username" value={user.email} readOnly hidden />
                            {user.hasPassword && (
                                <div className="form-div">
                                    <label htmlFor="current-password">Current password</label>
                                    <input type="password" name="current-password" id="current-password"
                                           autoComplete="current-password" required />
                                </div>
                            )}
                            <div className="form-div">
                                <label htmlFor="new-password">New password</label>
                                <input type="password" name="new-password" id="new-password"
                                       autoComplete="new-password" required minLength={6} maxLength={72} />
                            </div>
                            <div className="form-div">
                                <label htmlFor="confirm-new-password">Confirm new password</label>
                                <input type="password" name="confirm-new-password" id="confirm-new-password"
                                       autoComplete="new-password" required />
                            </div>
                            {passwordError && (
                                <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                                    {passwordError}
                                </p>
                            )}
                            {passwordSaved && (
                                <p className="w-full rounded-2xl bg-green-50 border border-green-200 text-green-700 px-4 py-3" role="status">
                                    {passwordSaved}
                                </p>
                            )}
                            <button type="submit" disabled={isSavingPassword} className="primary-button sm:w-fit px-6">
                                {isSavingPassword ? 'Saving...' : user.hasPassword ? 'Change password' : 'Set password'}
                            </button>
                        </form>
                    </section>

                    <section className="flex flex-col gap-4 bg-white rounded-2xl p-5 sm:p-8 border border-red-200">
                        <h3 className="text-xl font-bold text-red-700">Delete account</h3>
                        <p className="text-gray-600">
                            This permanently deletes your account and everything in it: all resumes, analyses,
                            improved resumes and cover letters.
                        </p>
                        <form onSubmit={handleDeleteAccount} className="!gap-4">
                            {user.hasPassword ? (
                                <div className="form-div">
                                    <label htmlFor="delete-confirm">Type your password to confirm</label>
                                    <input type="password" name="delete-confirm" id="delete-confirm"
                                           autoComplete="current-password" required />
                                </div>
                            ) : (
                                <div className="form-div">
                                    <label htmlFor="delete-confirm">Type your email <b className="break-all">{user.email}</b> to confirm</label>
                                    <input type="email" name="delete-confirm" id="delete-confirm" autoComplete="off" required />
                                </div>
                            )}
                            {deleteError && (
                                <p className="w-full rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3" role="alert">
                                    {deleteError}
                                </p>
                            )}
                            <button type="submit" disabled={isDeleting}
                                    className="min-h-11 px-6 rounded-full bg-red-600 text-white font-medium cursor-pointer hover:bg-red-700 w-full sm:w-fit disabled:opacity-60 disabled:cursor-not-allowed">
                                {isDeleting ? 'Deleting...' : 'Delete my account'}
                            </button>
                        </form>
                    </section>
                </div>
            </section>
        </main>
    )
}

export default Account
