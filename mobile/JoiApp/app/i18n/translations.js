// app/i18n/translations.js
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// ---- your dictionaries ----
const translations = {
  en: {
    personal: 'Personal',
    version: 'Version',
    account: 'Account',
    myPoint: 'My Point',
    viewSurvey: 'View Survey Results',
    settings: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    cameraMic: 'Camera & Microphone',
    consents: 'Consents',
    dataUsage: 'Data Usage',
    withdrawConsent: 'Withdraw Consent',
    legal: 'Legal',
    dataValuation: 'Joi Data Valuation Model',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    signOut: 'Sign Out',
    dangerZone: 'Danger Zone',
    deleteAccount: 'Delete Account',
    // generic
    unavailable: 'Unavailable',
    page_not_ready: 'This page is not available yet.',
    error: 'Error',
    consent_update_failed: 'Could not update consent. Please try again.',
    withdraw_consent: 'Withdraw Consent',
    withdraw_consent_desc: 'This will stop data collection and analysis immediately.',
    consent_withdrawn: 'Consent Withdrawn',
    consent_withdrawn_desc: 'We updated your settings and blocked analysis/uploads.',
    withdraw_failed: 'Failed to withdraw consent. Please try again.',
    edit_email: 'Edit Email',
    edit_email_desc: 'Email edit screen goes here.',
    sign_out: 'Sign Out',
    sign_out_confirm: 'Are you sure you want to sign out?',
    delete_account: 'Delete Account',
    delete_account_desc: 'This is permanent. Your data will be deleted (subject to legal retention).',
    deleted: 'Deleted',
    deleted_desc: 'Your account is scheduled for deletion. You will be logged out.',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    follow_system: 'Follow system',
    edit: 'Edit',
  },
  ko: {
    personal: '개인',
    version: '버전',
    account: '계정',
    myPoint: '내 포인트',
    viewSurvey: '설문 결과 보기',
    settings: '설정',
    language: '언어',
    notifications: '알림',
    cameraMic: '카메라 및 마이크',
    consents: '동의',
    dataUsage: '데이터 사용',
    withdrawConsent: '동의 철회',
    legal: '법적 고지',
    dataValuation: 'Joi 데이터 가치 평가 모델',
    privacy: '개인정보 처리방침',
    terms: '이용 약관',
    signOut: '로그아웃',
    dangerZone: '위험 구역',
    deleteAccount: '계정 삭제',
    // generic
    unavailable: '이용 불가',
    page_not_ready: '이 페이지는 아직 준비되지 않았습니다.',
    error: '오류',
    consent_update_failed: '동의 상태를 업데이트할 수 없습니다. 다시 시도해 주세요.',
    withdraw_consent: '동의 철회',
    withdraw_consent_desc: '데이터 수집과 분석을 즉시 중단합니다.',
    consent_withdrawn: '동의가 철회되었습니다',
    consent_withdrawn_desc: '설정을 업데이트하고 업로드/분석을 차단했습니다.',
    withdraw_failed: '동의 철회에 실패했습니다. 다시 시도해 주세요.',
    edit_email: '이메일 수정',
    edit_email_desc: '이메일 수정 화면이 여기에 표시됩니다.',
    sign_out: '로그아웃',
    sign_out_confirm: '로그아웃하시겠습니까?',
    delete_account: '계정 삭제',
    delete_account_desc: '이 작업은 영구적입니다. 관련 법규에 따라 데이터를 삭제합니다.',
    deleted: '삭제됨',
    deleted_desc: '계정 삭제가 예약되었습니다. 로그아웃됩니다.',
    cancel: '취소',
    confirm: '확인',
    delete: '삭제',
    follow_system: '시스템 설정 따르기',
    edit: '수정',
  },
};

// Create an instance
const i18n = new I18n(translations);

// Set locale (use language code only, e.g. 'en', 'ko')
i18n.locale = (Localization.locale || 'en').split('-')[0];

// Enable fallbacks (so 'en-US' falls back to 'en')
i18n.enableFallback = true;

export default i18n;
