export const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return '$0.00';
  
  let numericAmount: number;
  
  if (typeof amount === 'number') {
    numericAmount = amount;
  } else if (typeof amount === 'string') {
    numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return '$0.00';
  } else {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);
};
