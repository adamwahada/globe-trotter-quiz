import React from 'react';

// Import all avatar components
import { Lion, Fox, Bear, Penguin, Cat, Rabbit, Panda, Wolf, Owl, Deer, Frog, Dog } from './AvatarComponents';

interface AvatarDisplayProps {
  avatarId: string;
  color: string;
  size?: number;
  className?: string;
}

// Map avatar IDs to components
const AVATAR_COMPONENTS: { [key: string]: React.FC<{ color: string }> } = {
  lion: Lion,
  fox: Fox,
  bear: Bear,
  penguin: Penguin,
  cat: Cat,
  rabbit: Rabbit,
  panda: Panda,
  wolf: Wolf,
  owl: Owl,
  deer: Deer,
  frog: Frog,
  dog: Dog,
};

/**
 * Display an avatar SVG based on avatar ID and color
 * Falls back to Lion if avatar ID is not found
 */
export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  color,
  size = 40,
  className = '',
}) => {
  const AvatarComponent = AVATAR_COMPONENTS[avatarId.toLowerCase()] || Lion;

  return (
    <div
      className={`flex items-center justify-center rounded-full overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
      }}
    >
      <AvatarComponent color={color} />
    </div>
  );
};
