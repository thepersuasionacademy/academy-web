import React from 'react';
import { User, ArrowUpDown, Calendar, Mail, CheckSquare, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User as UserType } from '../types';

interface UserTableProps {
  paginatedUsers: UserType[];
  selectedUsers: string[];
  toggleUserSelection: (userId: string, e: React.MouseEvent) => void;
  toggleSelectAll: () => void;
  handleSort: (field: 'email' | 'created_at') => void;
  formatDate: (dateString: string) => string;
  getFullName: (user: UserType) => string | null;
}

export const UserTable: React.FC<UserTableProps> = ({
  paginatedUsers,
  selectedUsers,
  toggleUserSelection,
  toggleSelectAll,
  handleSort,
  formatDate,
  getFullName
}) => {
  const router = useRouter();

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--card-bg)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-4 py-4 text-left">
                <div 
                  className="flex items-center cursor-pointer"
                  onClick={toggleSelectAll}
                >
                  {selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-[var(--accent)]" />
                  ) : (
                    <Square className="w-5 h-5 text-[var(--text-secondary)]" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Name</span>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left cursor-pointer hover:bg-[var(--hover-bg)]"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Join Date</span>
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                  No users match your search criteria
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr 
                  key={user.id}
                  className={`border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--hover-bg)] ${selectedUsers.includes(user.id) ? 'bg-[var(--hover-bg)]' : ''}`}
                >
                  <td className="px-4 py-4">
                    <div 
                      className="cursor-pointer"
                      onClick={(e) => toggleUserSelection(user.id, e)}
                    >
                      {selectedUsers.includes(user.id) ? (
                        <CheckSquare className="w-5 h-5 text-[var(--accent)]" />
                      ) : (
                        <Square className="w-5 h-5 text-[var(--text-secondary)]" />
                      )}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {user.profile_image_url ? (
                        <img 
                          src={user.profile_image_url} 
                          alt={getFullName(user) || user.email}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
                          {(getFullName(user) || user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{getFullName(user) || 'No name'}</span>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-[var(--text-secondary)] cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    {user.email}
                  </td>
                  <td 
                    className="px-6 py-4 text-[var(--text-secondary)] cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 