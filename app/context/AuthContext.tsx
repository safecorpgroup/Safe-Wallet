import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/app/lib/storage';
import { supabase } from '@/app/lib/supabase';

export interface User {
  id: string;
  phone: string;
  email?: string;
  username?: string;
  wallet_address: string;
  gender: string;
  passcode_hash?: string;
  two_factor_enabled?: boolean;
  avatar_url?: string;
  created_at: string;
}

type AuthStep = 'welcome' | 'phone' | 'otp' | 'mnemonic' | 'profile' | 'passcode_setup' | 'passcode_verify' | 'done';

interface RateLimitInfo {
  remaining: number;
  resetAt?: string;
  isLimited: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authStep: AuthStep;
  setAuthStep: (step: AuthStep) => void;
  phoneNumber: string;
  setPhoneNumber: (p: string) => void;
  otpCode: string;
  setOtpCode: (c: string) => void;
  debugOtp: string;
  sendOtp: () => Promise<boolean>;
  sendEmailOtp: (email: string) => Promise<boolean>;
  verifyOtp: () => Promise<{ success: boolean; isNewUser: boolean }>;
  register: (data: { email?: string; username?: string; gender?: string; wallet_address: string; mnemonic_hash?: string }) => Promise<boolean>;
  setPasscode: (code: string) => Promise<boolean>;
  verifyPasscode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  generatedWallet: { address: string; mnemonic: string[] } | null;
  generateWallet: () => void;
  updateUser: (data: Partial<User>) => Promise<boolean>;
  rateLimitInfo: RateLimitInfo;
  smsDelivered: boolean;
  otpMethod: 'sms' | 'email';
  setOtpMethod: (m: 'sms' | 'email') => void;
  otpEmail: string;
  setOtpEmail: (e: string) => void;
}

const BIP39_SAMPLE = [
  'abandon','ability','able','about','above','absent','absorb','abstract',
  'absurd','abuse','access','accident','account','accuse','achieve','acid',
  'acoustic','acquire','across','act','action','actor','actual','adapt',
  'add','addict','address','adjust','admit','adult','advance','advice',
  'aerobic','affair','afford','afraid','again','age','agent','agree',
  'ahead','aim','air','airport','aisle','alarm','album','alcohol',
  'alert','alien','all','alley','allow','almost','alone','alpha',
  'already','also','alter','always','amateur','amazing','among','amount',
  'anchor','ancient','anger','angle','animal','ankle','announce','annual',
  'another','answer','antenna','antique','anxiety','any','apart','apology',
  'appear','apple','approve','april','arch','arctic','area','arena',
  'argue','arm','armor','army','arrange','arrest','arrive','arrow',
  'art','asset','assist','atom','attack','attend','audit','august',
  'aunt','author','auto','avocado','avoid','awake','aware','awesome',
  'balance','ball','bamboo','banana','banner','bar','barely','bargain',
  'barrel','base','basic','basket','battle','beach','bean','beauty',
  'because','become','beef','before','begin','behave','behind','believe',
  'below','belt','bench','benefit','best','betray','better','between',
  'beyond','bicycle','bid','bike','bind','biology','bird','birth',
  'bitter','black','blade','blame','blanket','blast','bleak','bless',
  'blind','blood','blossom','blow','blue','blur','blush','board',
  'border','boring','borrow','boss','bottom','bounce','box','brain',
  'brave','bread','breeze','brick','bridge','brief','bright','bring',
  'broken','brother','brown','brush','bubble','buddy','budget','buffalo',
  'build','bulb','bulk','bullet','bundle','burden','burger','burst',
  'bus','business','busy','butter','buyer','buzz','cabin','cable',
  'cactus','cage','cake','call','calm','camera','camp','canal',
  'cancel','candy','cannon','canoe','canvas','canyon','capable','capital',
  'captain','carbon','card','cargo','carpet','carry','cart','case',
  'cash','casino','castle','casual','catalog','catch','category','cattle',
  'caught','cause','caution','cave','ceiling','celery','cement','census',
  'century','cereal','certain','chair','chalk','champion','change','chaos',
  'chapter','charge','chase','cheap','check','cheese','cherry','chest',
  'chicken','chief','child','chimney','choice','choose','chronic','chunk',
  'church','cigar','circle','citizen','city','civil','claim','clap',
  'clarify','claw','clay','clean','clerk','clever','cliff','climb',
  'clinic','clip','clock','close','cloth','cloud','clown','club',
  'cluster','coach','coast','coconut','code','coffee','coil','coin',
  'collect','color','column','combine','come','comfort','comic','common',
  'company','concert','conduct','confirm','congress','connect','consider','control',
  'convince','cook','cool','copper','copy','coral','core','corn',
  'correct','cost','cotton','couch','country','couple','course','cousin',
  'cover','coyote','crack','cradle','craft','crane','crash','crater',
  'crawl','crazy','cream','credit','creek','crew','cricket','crime',
  'crisp','critic','crop','cross','crouch','crowd','crucial','cruel',
  'cruise','crumble','crush','cry','crystal','cube','culture','cup',
  'cupboard','curious','current','curtain','curve','cushion','custom','cute',
  'cycle','dad','damage','damp','dance','danger','daring','dash',
  'daughter','dawn','day','deal','debate','debris','decade','december',
  'decide','decline','decorate','decrease','deer','defense','define','defy',
  'degree','delay','deliver','demand','demise','denial','dentist','deny',
];

function generateRandomHex(bytes: number): string {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function generateMnemonic(): string[] {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    words.push(BIP39_SAMPLE[Math.floor(Math.random() * BIP39_SAMPLE.length)]);
  }
  return words;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [generatedWallet, setGeneratedWallet] = useState<{ address: string; mnemonic: string[] } | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({ remaining: 3, isLimited: false });
  const [smsDelivered, setSmsDelivered] = useState(false);
  const [otpMethod, setOtpMethod] = useState<'sms' | 'email'>('sms');
  const [otpEmail, setOtpEmail] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const stored = await storage.getItem('safe_wallet_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed.passcode_hash) {
          setAuthStep('passcode_verify');
        } else {
          setAuthStep('done');
        }
      }
    } catch (e) {
      console.error('Auth check error:', e);
    }
    setIsLoading(false);
  };

  const sendOtp = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'send_otp', phone: phoneNumber },
      });
      if (error) throw error;
      
      // Handle rate limiting
      if (data?.rate_limited) {
        setRateLimitInfo({
          remaining: 0,
          resetAt: data.reset_at,
          isLimited: true,
        });
        return false;
      }
      
      if (data?.debug_code) setDebugOtp(data.debug_code);
      setSmsDelivered(data?.sms_delivered === true);
      
      if (data?.remaining_attempts !== undefined) {
        setRateLimitInfo({
          remaining: data.remaining_attempts,
          isLimited: false,
        });
      }
      
      return data?.success === true;
    } catch (e: any) {
      console.error('Send OTP error:', e);
      // Check if it's a rate limit error (429)
      if (e?.message?.includes('429') || e?.status === 429) {
        setRateLimitInfo({ remaining: 0, isLimited: true });
      }
      return false;
    }
  };

  const sendEmailOtp = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'send_email_otp', email },
      });
      if (error) throw error;
      
      if (data?.rate_limited) {
        setRateLimitInfo({
          remaining: 0,
          resetAt: data.reset_at,
          isLimited: true,
        });
        return false;
      }
      
      if (data?.debug_code) setDebugOtp(data.debug_code);
      
      if (data?.remaining_attempts !== undefined) {
        setRateLimitInfo({
          remaining: data.remaining_attempts,
          isLimited: false,
        });
      }
      
      return data?.success === true;
    } catch (e: any) {
      console.error('Send email OTP error:', e);
      if (e?.message?.includes('429') || e?.status === 429) {
        setRateLimitInfo({ remaining: 0, isLimited: true });
      }
      return false;
    }
  };

  const verifyOtp = async (): Promise<{ success: boolean; isNewUser: boolean }> => {
    try {
      const body: any = { action: 'verify_otp', code: otpCode };
      if (otpMethod === 'email') {
        body.email = otpEmail;
      } else {
        body.phone = phoneNumber;
      }
      
      const { data, error } = await supabase.functions.invoke('auth-otp', { body });
      if (error) throw error;
      if (data?.success && !data?.is_new_user && data?.user) {
        const u = data.user;
        setUser(u);
        await storage.setItem('safe_wallet_user', JSON.stringify(u));
        if (u.passcode_hash) {
          setAuthStep('passcode_verify');
        } else {
          setAuthStep('done');
        }
        return { success: true, isNewUser: false };
      }
      return { success: data?.success === true, isNewUser: data?.is_new_user === true };
    } catch (e) {
      console.error('Verify OTP error:', e);
      return { success: false, isNewUser: false };
    }
  };

  const generateWallet = () => {
    const address = generateRandomHex(20);
    const mnemonic = generateMnemonic();
    setGeneratedWallet({ address, mnemonic });
  };

  const register = async (data: { email?: string; username?: string; gender?: string; wallet_address: string; mnemonic_hash?: string }): Promise<boolean> => {
    try {
      const { data: result, error } = await supabase.functions.invoke('auth-otp', {
        body: {
          action: 'register',
          phone: phoneNumber || undefined,
          email: data.email || otpEmail || undefined,
          username: data.username,
          gender: data.gender,
          wallet_address: data.wallet_address,
          mnemonic_hash: data.mnemonic_hash,
        },
      });
      if (error) throw error;
      if (result?.success && result?.user) {
        setUser(result.user);
        await storage.setItem('safe_wallet_user', JSON.stringify(result.user));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Register error:', e);
      return false;
    }
  };

  const setPasscodeFunc = async (code: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'set_passcode', user_id: user.id, passcode: code },
      });
      if (error) throw error;
      if (data?.success) {
        const updatedUser = { ...user, passcode_hash: code };
        setUser(updatedUser);
        await storage.setItem('safe_wallet_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Set passcode error:', e);
      return false;
    }
  };

  const verifyPasscode = async (code: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'verify_passcode', user_id: user.id, passcode: code },
      });
      if (error) throw error;
      return data?.valid === true;
    } catch (e) {
      console.error('Verify passcode error:', e);
      return user.passcode_hash === code;
    }
  };

  const updateUser = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: result, error } = await supabase.functions.invoke('auth-otp', {
        body: { action: 'update_user', user_id: user.id, ...data },
      });
      if (error) throw error;
      if (result?.success && result?.user) {
        const updatedUser = { ...user, ...result.user };
        setUser(updatedUser);
        await storage.setItem('safe_wallet_user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Update user error:', e);
      return false;
    }
  };

  const logout = async () => {
    await storage.removeItem('safe_wallet_user');
    await storage.removeItem('safe_wallet_assets');
    setUser(null);
    setAuthStep('welcome');
    setPhoneNumber('');
    setOtpCode('');
    setDebugOtp('');
    setGeneratedWallet(null);
    setRateLimitInfo({ remaining: 3, isLimited: false });
    setSmsDelivered(false);
    setOtpMethod('sms');
    setOtpEmail('');
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user && (authStep === 'done'),
      authStep, setAuthStep,
      phoneNumber, setPhoneNumber, otpCode, setOtpCode, debugOtp,
      sendOtp, sendEmailOtp, verifyOtp, register, logout,
      generatedWallet, generateWallet,
      setPasscode: setPasscodeFunc, verifyPasscode, updateUser,
      rateLimitInfo, smsDelivered, otpMethod, setOtpMethod, otpEmail, setOtpEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
