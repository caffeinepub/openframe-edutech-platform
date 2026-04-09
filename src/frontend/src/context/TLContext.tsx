import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../lib/storage";
import type {
  Commission,
  FieldExecutive,
  Registration,
  TLSession,
  TeamLeader,
} from "../types/models";

interface TLContextType {
  tlSession: TLSession | null;
  teamLeader: TeamLeader | null;
  fes: FieldExecutive[];
  registrations: Registration[];
  commissions: Commission[];
  lastUpdated: Date;
  login: (tlId: string) => void;
  logout: () => void;
  loadData: () => void;
}

const TLContext = createContext<TLContextType | null>(null);

export function TLProvider({ children }: { children: React.ReactNode }) {
  const [tlSession, setTlSession] = useState<TLSession | null>(() =>
    db.getTLSession(),
  );
  const [teamLeader, setTeamLeader] = useState<TeamLeader | null>(null);
  const [fes, setFes] = useState<FieldExecutive[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(() => {
    const session = db.getTLSession();
    if (!session) return;

    const tl = db.getTeamLeaderById(session.tlId);
    if (!tl) return;

    setTeamLeader(tl);

    const allFEs = db.getFEs();
    const assignedFEs = allFEs.filter((fe) => tl.assignedFEIds.includes(fe.id));
    setFes(assignedFEs);

    const allRegs = db.getRegistrations();
    const assignedFeIds = tl.assignedFEIds;
    const teamRegs = allRegs.filter((r) => assignedFeIds.includes(r.feId));
    setRegistrations(teamRegs);

    const tlCommissions = db.getTLCommissions(session.tlId);
    setCommissions(tlCommissions);

    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (tlSession) loadData();
  }, [tlSession, loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const login = useCallback((tlId: string) => {
    const tl = db.getTeamLeaderById(tlId);
    if (!tl) return;
    const session: TLSession = {
      tlId: tl.id,
      name: tl.name,
      phone: tl.phone,
      referralCode: tl.referralCode,
    };
    db.saveTLSession(session);
    setTlSession(session);
  }, []);

  const logout = useCallback(() => {
    db.clearTLSession();
    setTlSession(null);
    setTeamLeader(null);
    setFes([]);
    setRegistrations([]);
    setCommissions([]);
  }, []);

  return (
    <TLContext.Provider
      value={{
        tlSession,
        teamLeader,
        fes,
        registrations,
        commissions,
        lastUpdated,
        login,
        logout,
        loadData,
      }}
    >
      {children}
    </TLContext.Provider>
  );
}

export function useTL() {
  const ctx = useContext(TLContext);
  if (!ctx) throw new Error("useTL must be used inside TLProvider");
  return ctx;
}
