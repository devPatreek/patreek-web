'use client';

import styles from './WhoToFollowWidget.module.css';

const users = [
  { name: 'Ava Matthews', title: 'Culture Curator', handle: '@ava' },
  { name: 'Noah Reid', title: 'Tech Analyst', handle: '@noahreid' },
  { name: 'Mia Chen', title: 'Community Lead', handle: '@mia' },
];

export default function WhoToFollowWidget() {
  return (
    <div className={styles.widget}>
      <p className={styles.title}>Who to follow</p>
      <div className={styles.list}>
        {users.map(user => (
          <div key={user.handle} className={styles.item}>
            <div>
              <p className={styles.name}>{user.name}</p>
              <p className={styles.info}>
                {user.title} · <span className={styles.handle}>{user.handle}</span>
              </p>
            </div>
            <button className={styles.button} type="button">
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
