export interface Supplier {
  id: string;
  name: string;
  domain: string;
}

export const SUPPLIERS: Supplier[] = [
  { id: 'cupcake-jemma', name: 'Cupcake Jemma', domain: 'cupcakejemma.com' },
  { id: 'sallys-baking-addiction', name: "Sally's Baking Addiction", domain: 'sallysbakingaddiction.com' },
  { id: 'ottolenghi', name: 'Ottolenghi', domain: 'ottolenghi.co.uk' },
];

export const getSupplierById = (id: string): Supplier | undefined =>
  SUPPLIERS.find((s) => s.id === id);
