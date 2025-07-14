'use client';

interface UserAvatarProps {
  user?: {
    name?: string | null;
    email?: string;
    user_image?: string | null;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showName?: boolean;
}

export default function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showName = false 
}: UserAvatarProps) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-300 flex items-center justify-center ${className}`}>
        <span className={`text-gray-500 font-medium ${textSizeClasses[size]}`}>
          ?
        </span>
      </div>
    );
  }

  const displayName = user.name || user.email || '';
  const initials = displayName.split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0`}>
        {user.user_image ? (
          <img
            src={user.user_image}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className={`text-white font-medium ${textSizeClasses[size]}`}>
              {initials || '?'}
            </span>
          </div>
        )}
      </div>
      
      {showName && (
        <div className="ml-2 min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </div>
          {user.name && user.email && (
            <div className="text-xs text-gray-500 truncate">
              {user.email}
            </div>
          )}
        </div>
      )}
    </div>
  );
}