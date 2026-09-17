import { defineConfig, presetAttributify, presetUno } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  theme: {
    colors: {
      primary: '#18a058',
      primary_hover: '#36ad6a',
      primary_pressed: '#0c7a43',
      primary_active: '#36ad6a',
    },
  },
  shortcuts: {
    'bg-base': 'bg-white dark:bg-[#18181c]',
    'bg-container': 'bg-[#f8f9fa] dark:bg-[#101014]',
    'text-base': 'text-[#212529] dark:text-[#ffffffd1]',
    'border-base': 'border-[#e9ecef] dark:border-[#ffffff17]',
  },
  safelist: [
    ...[
      'pink',
      'purple',
      'orange',
      'blue',
      'green',
      'gray',
      'teal',
      'fuchsia',
      'cyan',
      'red',
      'amber',
      'lime',
    ].flatMap((c) => [
      `bg-${c}-50`,
      `text-${c}-600`,
      `dark:bg-${c}-900/20`,
      `dark:text-${c}-400`,
    ]),
  ],
});
