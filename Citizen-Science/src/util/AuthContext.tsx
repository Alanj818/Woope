import React, { createContext, useState, useEffect, ReactNode } from "react";
import { getToken } from "./token";
import { refreshAccessToken } from "./fetchWithToken";

interface AuthContextType {
	userToken: string | null;
	setUserToken: (token: string | null) => void;
	isAuthLoading: boolean;
}

const defaultAuthContextValue: AuthContextType = {
	userToken: null,
	setUserToken: () => {},
	isAuthLoading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [userToken, setUserToken] = useState<string | null>(null);
	const [isAuthLoading, setIsAuthLoading] = useState(true);

	useEffect(() => {
		const verifyToken = async () => {
			try {
				const token = await getToken("accessToken");

				if(!token) return;

				const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/verify-access-token`,
					{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ accessToken: token }),
					}
				);

				if (response.ok) {
					setUserToken(token);
					return;
				}

				const refreshToken = await getToken("refreshToken");
				if(!refreshToken) return;

				const refreshedAccessToken = await refreshAccessToken(setUserToken);
				if(refreshedAccessToken){
					setUserToken(refreshedAccessToken);
				}

			} catch (error) {
				console.error("Error verifying token:", error);
			} finally {
				setIsAuthLoading(false);
			}
		};

		verifyToken();
	}, []);

	return (
		<AuthContext.Provider value={{ userToken, setUserToken, isAuthLoading }}>
			{children}
		</AuthContext.Provider>
	);
};
