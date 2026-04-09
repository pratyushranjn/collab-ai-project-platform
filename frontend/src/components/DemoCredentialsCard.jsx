import React from "react";

export default function DemoCredentialsCard({
    email,
    password,
    onCopyEmail,
    onCopyPassword,
    onUseInLogin,
}) {
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-md w-60 p-3 text-sm">
            <p className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Demo Admin Access</span>
                <span className="inline-flex items-center rounded-full border border-green-500/40 bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                    r--
                </span>
            </p>

            <div className="mt-2 space-y-1.5 text-xs">
                <p className="text-gray-200 break-all"><span className="text-gray-400">Email:</span> {email}</p>
                <p className="text-gray-200 break-all"><span className="text-gray-400">Password:</span> {password}</p>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={onCopyEmail}
                    className="px-2 py-1 rounded border border-gray-600 bg-gray-800 hover:bg-gray-700 text-[11px] text-white"
                >
                    Copy Email
                </button>
                <button
                    type="button"
                    onClick={onCopyPassword}
                    className="px-2 py-1 rounded border border-gray-600 bg-gray-800 hover:bg-gray-700 text-[11px] text-white"
                >
                    Copy Password
                </button>
                <button
                    type="button"
                    onClick={onUseInLogin}
                    className="px-2 py-1 rounded border border-blue-600 bg-blue-700 hover:bg-blue-600 text-[11px] text-white"
                >
                    Use In Login
                </button>
            </div>
        </div>
    );
}
