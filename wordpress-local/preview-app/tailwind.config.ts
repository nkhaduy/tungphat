import type { Config } from 'tailwindcss';
import base from '../../tailwind.config';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
export default { ...base, content: [path.join(root, 'app/**/*.{js,ts,jsx,tsx,mdx}'), path.join(root, 'components/**/*.{js,ts,jsx,tsx,mdx}'), path.join(__dirname, 'app/**/*.{js,ts,jsx,tsx,mdx}')] } satisfies Config;
