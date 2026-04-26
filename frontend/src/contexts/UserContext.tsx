import { createContext, useContext, useState, useMemo, ReactNode } from "react";

interface UserContextType {
  firstName: string;
  middleName: string;
  lastName: string;
  studentId: string;
  email: string;
  name: string;
  profilePhoto: string;
  setUser: (data: { firstName: string; middleName?: string; lastName: string; email: string; studentId?: string }) => void;
  setProfilePhoto: (photo: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function buildName(first: string, middle: string, last: string) {
  return [first, middle, last].filter(Boolean).join(" ");
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [firstName, setFirstName] = useState(() => localStorage.getItem("apex-user-firstName") || "");
  const [middleName, setMiddleName] = useState(() => localStorage.getItem("apex-user-middleName") || "");
  const [lastName, setLastName] = useState(() => localStorage.getItem("apex-user-lastName") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("apex-user-email") || "");
  const [studentId, setStudentId] = useState(() => localStorage.getItem("apex-user-studentId") || "");
  const [profilePhoto, setProfilePhotoState] = useState(() => localStorage.getItem("apex-user-photo") || "");

  const name = useMemo(() => buildName(firstName, middleName, lastName), [firstName, middleName, lastName]);

  const setUser = (data: { firstName: string; middleName?: string; lastName: string; email: string; studentId?: string }) => {
    setFirstName(data.firstName);
    setMiddleName(data.middleName || "");
    setLastName(data.lastName);
    setEmail(data.email);
    setStudentId(data.studentId || "");
    localStorage.setItem("apex-user-firstName", data.firstName);
    localStorage.setItem("apex-user-middleName", data.middleName || "");
    localStorage.setItem("apex-user-lastName", data.lastName);
    localStorage.setItem("apex-user-email", data.email);
    localStorage.setItem("apex-user-studentId", data.studentId || "");
  };

  const setProfilePhoto = (photo: string) => {
    setProfilePhotoState(photo);
    if (photo) {
      localStorage.setItem("apex-user-photo", photo);
    } else {
      localStorage.removeItem("apex-user-photo");
    }
  };

  return (
    <UserContext.Provider value={{ firstName, middleName, lastName, studentId, email, name, profilePhoto, setUser, setProfilePhoto }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
