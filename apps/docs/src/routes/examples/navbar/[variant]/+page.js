export const entries = () => ['developer', 'marketing', 'floating'].map((variant) => ({ variant }));
export const load = ({ params }) => ({ variant: params.variant });
