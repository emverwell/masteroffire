export interface Cart{
    productId: string;
    productName: string;
    productImage: string;
    productDetails: Map<string, string>;
    quantity: number;
    price: number;
}