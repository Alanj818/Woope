const pool = require('../db');

export type userAction = 'login' | 'register' | 'pin_drop' | 'post' | 'bug_report' | 'logout' ;

export async function logAction(userId: number, action: userAction){
    return pool.query(
        `INSERT INTO user_actions (user_id, action)
         VALUES ($1, $2)`,
        [userId, action]
      );
}

export async function logLogin(userId: number) {
    return logAction(userId, 'login');
}

export async function logRegister(userId: number) {
    return logAction(userId, 'register');
}

export async function logPinDrop(userId: number) {
    return logAction(userId, 'pin_drop');
}

export async function logPosts(userId: number) {
    return logAction(userId, 'post');
}

export async function logBugReports(userId: number): Promise <void>{
    return logAction(userId, 'bug_report');
}

export async function logLogout(userId: number) {
    return logAction(userId, 'logout');
}