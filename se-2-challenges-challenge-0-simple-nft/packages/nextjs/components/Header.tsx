"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BugAntIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { useAccount } from "wagmi";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  subLinks?: { label: string; href: string; icon?: React.ReactNode; }[]; // 支持子菜单
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "我的 NFTs",
    href: "/myNFTs",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFT 商城",
    href: "/market",
    icon: <PhotoIcon className="h-4 w-4" />,
    subLinks: [
      { label: "上架管理", href: "/myListedNFT", icon: <PhotoIcon className="h-4 w-4" /> },
      { label: "交易历史", href: "/transfers", icon: <ArrowPathIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "拍卖中心",
    href: "/auction",
    icon: <PhotoIcon className="h-4 w-4" />,
    subLinks: [
      { label: "拍品管理", href: "/auctionManagement", icon: <PhotoIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "盲盒俱乐部",
    href: "/blindBox",
    icon: <PhotoIcon className="h-4 w-4" />,
    subLinks: [
      { label: "盲盒管理", href: "/blindBox/management", icon: <PhotoIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "管理员后台",
    href: "/adminManagement",
    icon: <PhotoIcon className="h-4 w-4" />,
    subLinks: [
      { label: "批量铸造", href: "/adminManagement/BatchMint", icon: <PhotoIcon className="h-4 w-4" /> },
      { label: "空投", href: "/adminManagement/AirDrop", icon: <PhotoIcon className="h-4 w-4" /> },
    ],
  },
  {
    label: "IPFS Upload",
    href: "/ipfsUpload",
    icon: <ArrowUpTrayIcon className="h-4 w-4" />,
  },
  {
    label: "IPFS Download",
    href: "/ipfsDownload",
    icon: <ArrowDownTrayIcon className="h-4 w-4" />,
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const { address: connectedAddress} = useAccount();
  
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon, subLinks }) => {
        if(href === "/adminManagement" && connectedAddress !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS){
          return;
        }
        if(href === "/debug" && connectedAddress !== process.env.NEXT_PUBLIC_ADMIN_ADDRESS){
          return;
        }
        const isActive = pathname === href;
        return (
          <li key={href} className="relative group">
            <Link
              href={href}
              passHref
              className={`${isActive ? "bg-secondary shadow-md" : ""
                } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
            {subLinks && (
              <ul
                className="absolute left-0 top-full mt-1 menu menu-compact bg-base-100 shadow-lg rounded-box w-48 opacity-0 visibility-hidden transition-opacity duration-300 ease-in-out group-hover:opacity-100 group-hover:visibility-visible group-hover:delay-200 z-10"
              >
                {subLinks.map(({ label: subLabel, href: subHref, icon }) => (
                  <li key={subHref}>
                    <Link href={subHref} passHref>
                      {icon}
                      <span>{subLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
};


/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <div className="sticky xl:static top-0 navbar bg-primary min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto xl:w-1/2">
        <div className="xl:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => {
              setIsDrawerOpen(prevIsOpenState => !prevIsOpenState);
            }}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => {
                setIsDrawerOpen(false);
              }}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <Link href="/" passHref className="hidden xl:flex items-center gap-1 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">SRE Challenges</span>
            <span className="text-xs">#0: Simple NFT</span>
          </div>
        </Link>
        <ul className="hidden xl:flex xl:flex-nowrap menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex-grow mr-4">
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};
