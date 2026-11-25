import React from 'react';
import { Bell, GraduationCap, CheckCircle2, Award, Clock } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'exam' | 'enrollment' | 'certificate';
  title: string;
  timeAgo: string;
  message: string;
  unread?: boolean;
}

export const CandidateNotifications: React.FC = () => {
  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      type: 'exam',
      title: 'Exam Reminder',
      timeAgo: '2h ago',
      message: 'Your Playwright exam is scheduled on 15 Nov 2026 at 10:00 AM.',
      unread: true,
    },
    {
      id: 'notif_2',
      type: 'enrollment',
      title: 'Enrollment Successful',
      timeAgo: '1d ago',
      message: 'You have successfully enrolled for AIICQB-AT-CP® certification.',
      unread: false,
    },
    {
      id: 'notif_3',
      type: 'certificate',
      title: 'Certificate Issued',
      timeAgo: '3d ago',
      message: 'Your AIICQB-ST-CP® certificate is now available for download.',
      unread: false,
    },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header matching Screen 8 in Screenshot */}
      <div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F47716] flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#10264B]">Notifications</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Stay updated with your exams, courses and certifications.
        </p>
      </div>

      {/* Notifications List matching Screen 8 */}
      <div className="space-y-3 pt-1">
        {notifications.map((item) => {
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-sm transition-all flex items-start space-x-3.5 ${
                item.unread ? 'border-orange-200 bg-orange-50/10' : 'border-gray-200'
              }`}
            >
              {/* Icon Square matching Screen 8 */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === 'exam'
                    ? 'bg-orange-100 text-[#F47716]'
                    : item.type === 'enrollment'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-purple-100 text-purple-600'
                }`}
              >
                {item.type === 'exam' && <GraduationCap className="w-5 h-5 stroke-[2.2]" />}
                {item.type === 'enrollment' && <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />}
                {item.type === 'certificate' && <Award className="w-5 h-5 stroke-[2.2]" />}
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#10264B]">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                    {item.timeAgo}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateNotifications;
