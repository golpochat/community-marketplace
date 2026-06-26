'use client';



import { useEffect, useState } from 'react';



import type { BuyerTrustProfile } from '@community-marketplace/types';



import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';

import { BuyerProfileTrustSection } from '@/components/trust/buyer-profile-trust-section';

import { buyerService } from '@/services/marketplace.service';

import { trustService } from '@/services/trust.service';



export default function Page() {

  const [trust, setTrust] = useState<BuyerTrustProfile | null>(null);



  useEffect(() => {

    void trustService.getMyBuyerTrust().then(setTrust).catch(() => setTrust(null));

  }, []);



  return (

    <div className="space-y-6">

      <ProfileSettingsForm

        title="Settings"

        description="Manage your profile and preferences."

        loadProfile={() => buyerService.getProfile()}

        saveProfile={(body) => buyerService.updateProfile(body)}

      />

      <BuyerProfileTrustSection

        visibleToSeller

        phoneVerified={trust?.phoneVerified}

        completedTransactions={trust?.completedTransactions}

        isCommunityMember={trust?.isCommunityMember}

        averageRating={trust?.averageRating}

        reviewCount={trust?.reviewCount}

        memberSince={trust?.memberSince}

      />

    </div>

  );

}

