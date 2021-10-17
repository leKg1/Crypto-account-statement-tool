import React from "react"
import { Link } from "react-router-dom"
import { Box, Flex, Text, Button, Stack, PseudoBox } from "@chakra-ui/react"
import Logo from "../ui/Logo"

import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons"

const MenuItems = props => {
  const { children, isLast, to = "/", ...rest } = props
  return (
    <Text
      mb={{ base: isLast ? 0 : 8, sm: 0 }}
      mr={{ base: 0, sm: isLast ? 0 : 8 }}
      display="block"
      {...rest}
    >
      <Link to={to}>{children}</Link>
    </Text>
  )
}

const Header = props => {
  const [show, setShow] = React.useState(false)
  const toggleMenu = () => setShow(!show)

  return (
    <Flex
      as="nav"
      align="center"
      justify="space-between"
      wrap="wrap"
      w="100%"
      mb={8}
      p={8}
      bg={["primary.500", "primary.500", "transparent", "transparent"]}
      color={["white", "purple.700", "primary.700", "primary.700"]}
      {...props}
    >
      <Flex align="center">
        <Logo
          w="100px"
          color={["white", "purple.700", "primary.500", "primary.500"]}
        />
      </Flex>

      <Box display={{ base: "block", md: "none" }} onClick={toggleMenu}>
        {show ? <CloseIcon /> : <HamburgerIcon />}
      </Box>

      <Box
        display={{ base: show ? "block" : "none", md: "block" }}
        flexBasis={{ base: "100%", md: "auto" }}
      >
        <Flex
          align={["center", "center", "center", "center"]}
          justify={["center", "space-between", "flex-end", "flex-end"]}
          direction={["column", "row", "row", "row"]}
          pt={[4, 4, 0, 0]}
        >
          <MenuItems to="/">Home</MenuItems>
          <MenuItems to="/how">How It works </MenuItems>
          <MenuItems to="/documentation">Documentation </MenuItems>
          <MenuItems to="/faq">FAQ </MenuItems>
          <MenuItems to="/cryptoAccountStatement" isLast>
            <Button
              size="md"
              rounded="md"
              color={["primary.500", "white", "white", "white"]}
              bg={["white", "purple.700", "primary.500", "primary.500"]}
              // _hover={{
              //   bg: [
              //     "primary.100",
              //     "primary.100",
              //     "primary.600",
              //     "primary.600",
              //   ],
              // }}
            >
            Use C-A-S-T
            </Button>
          </MenuItems>
        </Flex>
      </Box>
    </Flex>
  )
}

export default Header