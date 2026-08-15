export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  base_price: number;
  image_url?: string | null;
  created_at: string;
}

export interface DealComparisonItem {
  id: number;
  source: string;
  source_type: string;
  price: number;
  discount_details?: string | null;
  savings_vs_base: number;
}

export interface CardPaymentOption {
  id: number;
  name: string;
  reward_rate: number;
  reward_type?: string | null;
  description?: string | null;
  reward_earned_on_best_deal: number;
  effective_price_on_best_deal: number;
}

export interface BestWayToPay {
  product_name: string;
  base_price: number;
  cheapest_deal: DealComparisonItem;
  best_card?: CardPaymentOption | null;
  cheapest_source_price: number;
  card_reward_rate: number;
  card_reward_earned: number;
  effective_price: number;
  total_savings: number;
  savings_percentage: number;
  payment_recommendation: string;
}

export interface SearchComparisonResult {
  product: Product;
  deals: DealComparisonItem[];
  cards: CardPaymentOption[];
  best_way_to_pay: BestWayToPay;
}

export interface SavedComparison {
  id: number;
  user_id: number;
  product_id?: number | null;
  title: string;
  notes?: string | null;
  comparison_data: any;
  best_deal_price: number;
  total_savings: number;
  created_at: string;
}

export interface SavedComparisonCreate {
  product_id?: number | null;
  title: string;
  notes?: string | null;
  comparison_data: any;
  best_deal_price: number;
  total_savings: number;
}
