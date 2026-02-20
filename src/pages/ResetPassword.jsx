import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast, { Toaster } from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        const result = await authService.updatePassword(password);

        if (result.success) {
            toast.success('Contraseña actualizada correctamente. Redirigiendo...');
            setTimeout(() => navigate('/login'), 2000);
        } else {
            toast.error(result.error || 'Error al actualizar la contraseña');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter">
                        Nueva Contraseña
                    </h1>
                    <p className="text-gray-500">Crea una nueva contraseña segura para tu cuenta.</p>
                </div>

                <Card className="shadow-2xl">
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            required
                            icon={<Lock size={20} />}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />

                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            required
                            icon={<Lock size={20} />}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                        >
                            Actualizar Contraseña
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
