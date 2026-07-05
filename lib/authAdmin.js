import { getUserRole } from '@/lib/userRoleCache';

const authAdmin = async (userId) => {
    try {
        const role = await getUserRole(userId);
        return role === 'admin';
    } catch (error) {
        console.error('Error checking admin access:', error);
        return false;
    }
};

export default authAdmin;
