'use client';



import { useEffect, useState } from 'react';



import type { ListingSellerSummary, SellerTrustProfile } from '@community-marketplace/types';



import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';

import { SellerProfileTrustSection } from '@/components/trust/seller-profile-trust-section';

import { sellerService } from '@/services/marketplace.service';

import { trustService } from '@/services/trust.service';

import { useAuth } from '@/hooks/use-auth';



function mapTrustToSeller(userId: string, email: string, profile: SellerTrustProfile): ListingSellerSummary {

  return {

    id: userId,

    email,

    verified: profile.verified,

    phoneVerified: profile.phoneVerified,

    memberSince: profile.memberSince,

    activeListingCount: profile.activeListingCount,

    soldCount: profile.soldCount,

    averageRating: profile.averageRating,

    reviewCount: profile.reviewCount,

    responseRate: profile.responseRate,

    responseTimeMinutes: profile.responseTimeMinutes,

    isAmbassador: profile.isAmbassador,

    isBusiness: profile.isBusiness,

  };

}



export default function Page() {

  const { user } = useAuth();

  const [trust, setTrust] = useState<ListingSellerSummary | undefined>();



  useEffect(() => {

    if (!user?.id) return;

    void trustService

      .getSellerTrust(user.id)

      .then((profile) => {

        setTrust(mapTrustToSeller(user.id, user.email ?? '', profile));

      })

      .catch(() => undefined);

  }, [user?.id, user?.email]);



  return (

    <div className="space-y-6">

      <ProfileSettingsForm

        title="Settings"

        description="Manage your store profile and preferences."

        loadProfile={() => sellerService.getProfile()}

        saveProfile={(body) => sellerService.updateProfile(body)}

        notificationRole="SELLER"

      />

      <SellerProfileTrustSection seller={trust} />

    </div>

  );

}

