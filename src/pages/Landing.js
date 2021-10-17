import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Heading, Box, Button, Link, Table, Tbody, Tr, Td, } from "@chakra-ui/react"
import Hero from "../components/sections/Hero";
import LandingLayout from "../components/layouts/LandingLayout";
import NewPhoto2 from '../utils/NewPhoto2.jpeg'

const Landing = () => {

    return (
        <LandingLayout>
          <Hero
            title="C-A-S-T"
            subtitle="Crypto Account statement tool"
            image={NewPhoto2}
            // image="https://source.unsplash.com/collection/404339/800x600"
            ctaText="Use C-A-S-T now"
            ctaLink="/cryptoAccountStatement"
          />
        </LandingLayout>
      );
    }
    export default Landing