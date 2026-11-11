export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
}

export interface Ad {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  city: string;
  images: string[];
  created_at: string;
  seller?: Profile;
  is_favorite?: boolean;
}

export interface Chat {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  ad?: Ad;
  other_user?: Profile;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const CATEGORIES = [
  'Cars',
  'Bikes',
  'Mobile Phones',
  'Electronics',
  'Furniture',
  'Fashion',
  'Books',
  'Sports',
  'Property',
  'Jobs',
  'Services',
  'Other',
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Noida',
  'Gurgaon',
  'Thane',
  'Navi Mumbai',
];
