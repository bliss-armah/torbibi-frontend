// Shared types used across features — mirrors backend domain shapes

export type UserRole = 'customer' | 'shop_owner' | 'admin';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isPhoneVerified: boolean;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  phone: string;
  email: string | null;
  address: ShopAddress | null;
  status: 'active' | 'inactive' | 'suspended';
  currency: string;
}

export interface ShopAddress {
  region: string;
  city: string;
  area?: string;
  digitalAddress?: string;
}

export interface ProductImage {
  url: string;
  publicId?: string; // Cloudinary public_id — stored so removed images can be deleted
  alt: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;            // In pesewas
  compareAtPrice: number | null;
  sku: string | null;
  quantity: number;
  trackInventory: boolean;
  images: ProductImage[];
  categoryId: string | null;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DeliveryInfo {
  driverPhone?: string;
  vehicleNumber?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  shopId: string;
  shopSlug?: string | null;  // Included in buyer-facing list responses
  customerId: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference: string | null;
  shippingAddress: ShippingAddress;
  notes: string | null;
  deliveryInfo: DeliveryInfo | null;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  region: string;
  city: string;
  area?: string;
  digitalAddress?: string;
  notes?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
