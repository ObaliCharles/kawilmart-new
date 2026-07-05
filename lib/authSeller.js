import { getUserRole } from '@/lib/userRoleCache';

const authSeller = async (userId) => {
    try {
        const role = await getUserRole(userId);
        return role === 'seller' || role === 'admin';
    } catch (error) {
        console.error('Error checking seller access:', error);
        return false;
    }
};

export default authSeller;
