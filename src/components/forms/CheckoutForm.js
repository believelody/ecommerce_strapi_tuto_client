import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Box, Heading, Text, Label, Button, Divider } from 'gestalt'
import FieldInput from '../input/FieldInput'
import CartResume from '../cart/CartResume'
import { useAppHooks } from '../../contexts'
import isEmpty from '../../utils/isEmpty'
import { SET_TOAST } from '../../reducers/toastReducer'
import { OPEN_MODAL } from '../../reducers/modalReducer'
import { SET_LOADING, RESET_LOADING } from '../../reducers/loadingReducer'
import api from '../../api'
import { navigate } from '@reach/router'
import { PAYMENT_FAILED, RESET_ERROR } from '../../reducers/checkoutReducer'
import { IMPORT_CART_FROM_LOCALSTORAGE, RESET_CART } from '../../reducers/cartReducer'
import { getCart, resetCart } from '../../utils/cart.utils';
import StripeCheckout from '../stripe/StripeCheckout';

const CheckoutFormStyle = styled.form`
    display: inline-block;
    text-align: center;
    max-width: 450;
`

const CheckoutForm = ({ stripe }) => {
    const { useCheckout, useToast, useModal, useLoading, useCart, useAuth } = useAppHooks()
    const [{ isPaymentSucceed, errors }, dispatchCheckout] = useCheckout
    const [toastState, dispatchToast] = useToast
    const [modalState, dispatchModal] = useModal
    const [{ loading }, dispatchLoading] = useLoading
    const [{cart, total}, dispatchCart] = useCart
    const [{user}, dispatchAuth] = useAuth

    const [address, setAddress] = useState('')
    const [optional, setOptional] = useState('')
    const [city, setCity] = useState('')
    const [zip, setZIP] = useState('')

    const handleAddress = e => setAddress(e.value)
    const handleOptional = e => setOptional(e.value)
    const handleCity = e => setCity(e.value)
    const handleZIP = e => setZIP(e.value)

    const submition = async () => {
        try {
            const res = await stripe.createToken()
            let token = res.token.id
            await api.order.createOrder({
              amount: +total,
              products: cart,
              address,
              zip,
              city,
              token
            })
            await api.order.sendOrderEmail({
              to: 'believelody@gmail.com',
              subject: `Order Confirmation - StrapiTuto ${new Date()}`,
              text: 'Your order has been processed',
              html: '<bold>Expect your order to arrive in 2-3 shipping days</bold>'
            })
            setAddress('')
            setOptional('')
            setCity('')
            setZIP('')
            dispatchLoading({ type: RESET_LOADING })
            resetCart()
            dispatchCart({ type: RESET_CART })
            dispatchToast({ type: SET_TOAST, payload: { msg: `Your order was successfully submitted. Thanks for your purchase` } })
            navigate('/')
        } catch (error) {
            console.log(error.message)
            dispatchCheckout({ type: PAYMENT_FAILED, payload: { payment_failed: error.message } })
            dispatchLoading({ type: RESET_LOADING })
        }
    }

    const confirmOrder = (e) => {
        e.preventDefault()
        dispatchCheckout({ type: RESET_ERROR })
        if (isEmpty(address)) {
            dispatchCheckout({ type: PAYMENT_FAILED, payload: { address: 'address is required' } })
        }
        else if (isEmpty(zip)) {
            dispatchCheckout({ type: PAYMENT_FAILED, payload: { zip: 'zip is required' } })
        }
        else if (isEmpty(city)) {
            dispatchCheckout({ type: PAYMENT_FAILED, payload: { city: 'city is required' } })
        }
        else {
            dispatchLoading({ type: SET_LOADING, payload: {msg: 'Submitting Order, please wait...'} })
            submition()
        }
    }

    useEffect(() => {
      if (!getCart()) {
        navigate('/cart')
      }
      if (cart.length === 0 && getCart()) {
        dispatchCart({ type: IMPORT_CART_FROM_LOCALSTORAGE, payload: {cart: getCart()} })
      }
    }, [])

    useEffect(() => {
        if (errors && errors.payment_failed) {
            dispatchModal({ type: OPEN_MODAL, payload: { msg: errors.payment_failed } })
        }
    }, [errors])

    return (
        <Box
            dangerouslySetInlineStyle={{
                __style: {
                    backgroundColor: '#d6a3b1'
                }
            }}
            margin={4}
            padding={5}
            shape='rounded'
            display='flex'
            justifyContent='center'
            direction='column'
        >
          {
            cart.length > 0 &&
            <React.Fragment>
              <CartResume cart={cart} total={total} />
              <Divider />
            </React.Fragment>
          }
            <CheckoutFormStyle onSubmit={confirmOrder}>
                <Box marginBottom={2} display='flex' direction='column' alignItems='center'>
                    <Heading color='midnight'>Checkout</Heading>
                </Box>
                <Box display='flex' alignItems='center' justifyContent='between' paddingY={2}>
                    <Label htmlFor='address'>
                        <Text>Address</Text>
                    </Label>
                    <FieldInput
                        id='address'
                        type='text'
                        name='address'
                        value={address}
                        placeholder='Shipping Address'
                        handleChange={handleAddress}
                        error={!!errors && errors.address}
                    />
                </Box>
                <Box display='flex' alignItems='center' justifyContent='between' paddingY={2}>
                    <Label htmlFor='optional'>
                        <Text>Optional Information Address</Text>
                    </Label>
                    <FieldInput
                        id='optional'
                        type='text'
                        name='optional'
                        value={optional}
                        placeholder='Optional information about your address'
                        handleChange={handleOptional}
                    />
                </Box>
                <Box display='flex' alignItems='center' justifyContent='between' paddingY={2}>
                    <Label htmlFor='city'>
                        <Text>City</Text>
                    </Label>
                    <FieldInput
                        id='city'
                        type='text'
                        name='city'
                        value={city}
                        placeholder='City of your Residence'
                        handleChange={handleCity}
                    />
                </Box>
                <Box display='flex' alignItems='center' justifyContent='between' paddingY={2}>
                    <Label htmlFor='zip'>
                        <Text>ZIP</Text>
                    </Label>
                    <FieldInput
                        id='zip'
                        type='text'
                        name='zip'
                        pattern="[0-9]*"
                        value={zip}
                        placeholder='Enter your Postal code'
                        handleChange={handleZIP}
                        error={!!errors && errors.zip}
                    />
                </Box>
                <StripeCheckout />
                <Box paddingY={2}>
                    <button id='stripe__button' type='submit'>Confirm Order</button>
                </Box>
            </CheckoutFormStyle>
        </Box>
    )
}

export default CheckoutForm
