import type { IconProps } from '@/components/atoms/types/types';

export default function BarChartIcon({
  width = 20,
  height = 20,
  color = 'currentColor'
}: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 12h2v8H5zm4-6h2v14H9zm4 2h2v12h-2zm4-4h2v16h-2z" />
    </svg>
  );
}
