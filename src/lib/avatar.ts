const avatares = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸',
    '🐙', '🦄', '🐧', '🐦', '🐤', '🐴', '🦁', '🐯', '🐒', '🐶',
    '⭐', '🌟', '⚽', '🏀', '🎮', '🎲', '🎯', '🎨', '🎭', '🎪'
  ];
  
  export function getRandomAvatar(): string {
    return avatares[Math.floor(Math.random() * avatares.length)];
  }
  
  export function getAvatarById(id: string): string {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatares[index % avatares.length];
  }