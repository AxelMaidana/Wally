import {
    Coffee,
    ShoppingCart,
    Car,
    Home,
    HeartPulse,
    Ticket,
    Zap,
    Briefcase,
    Shirt,
    Circle
} from 'lucide-react';

const categoryIcons = {
    comida: Coffee,
    cafe: Coffee,
    café: Coffee,
    restaurante: Coffee,
    supermercado: ShoppingCart,
    compras: ShoppingCart,
    transporte: Car,
    nafta: Car,
    alquiler: Home,
    hogar: Home,
    salud: HeartPulse,
    ocio: Ticket,
    entretenimiento: Ticket,
    servicios: Zap,
    sueldo: Briefcase,
    trabajo: Briefcase,
    ropa: Shirt,
};

export const CategoryIcon = ({ categoria, className }) => {
    const Icon = categoryIcons[categoria?.toLowerCase()] || Circle;
    return <Icon className={className} strokeWidth={1.75} />;
};
