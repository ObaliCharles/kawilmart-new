'use client'
import React from 'react';
import Link from 'next/link';
import { assets } from '../../assets/assets';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

const SideBar = () => {
    const pathname = usePathname();
    const { isAdmin } = useAppContext();

    const menuItems = [
        { name: 'Dashboard', path: '/seller', icon: assets.add_icon },
        { name: 'Product List', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Orders', path: '/seller/orders', icon: assets.order_icon },
    ];

    const shortcuts = [
        ...(isAdmin ? [{ name: 'Admin Panel', path: '/admin', icon: '🛡️', accentClassName: 'text-orange-600 font-medium' }] : []),
        { name: 'Back to Store', path: '/', icon: '🏠', accentClassName: 'text-gray-500' },
    ];

    return (
        <div className="w-full border-b border-gray-300 bg-white text-base md:min-h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="flex gap-2 overflow-x-auto px-2 py-2 md:flex-col md:gap-0 md:overflow-visible md:px-0">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;

                    return (
                        <Link href={item.path} key={item.name} passHref className="shrink-0 md:block">
                            <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 md:rounded-none md:px-4 ${
                                isActive
                                    ? 'bg-orange-600/10 md:border-r-[6px] border-orange-500/90'
                                    : 'hover:bg-gray-100/90'
                            }`}>
                                <Image
                                    src={item.icon}
                                    alt={`${item.name.toLowerCase()}_icon`}
                                    className="h-6 w-6 shrink-0 md:h-7 md:w-7"
                                />
                                <p className="whitespace-nowrap text-sm text-gray-700 md:text-base">{item.name}</p>
                            </div>
                        </Link>
                    );
                })}

                {shortcuts.map((item) => {
                    const isActive = item.path === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.path);

                    return (
                        <Link href={item.path} key={item.name} passHref className="shrink-0 md:block">
                            <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 md:px-4 ${
                                isActive
                                    ? 'bg-orange-600/10 md:border-r-[6px] border-orange-500/90'
                                    : 'hover:bg-gray-100/90'
                            }`}>
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg md:h-7 md:w-7 md:text-xl">
                                    {item.icon}
                                </span>
                                <p className={`whitespace-nowrap text-sm md:text-base ${item.accentClassName}`}>
                                    {item.name}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default SideBar;
