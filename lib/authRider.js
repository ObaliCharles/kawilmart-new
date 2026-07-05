import { getUserRole } from '@/lib/userRoleCache';

const authRider = async (userId) => {
    try {
        const role = await getUserRole(userId);
        return role === 'rider' || role === 'admin';
    } catch (error) {
        console.error('Error checking rider access:', error);
        return false;
    }
};

export default authRider;
