from mwoauth import ConsumerToken, Handshaker, tokens
from django.shortcuts import redirect
# Consruct a "consumer" from the key/secret provided by MediaWiki
from . import oauth_config


def wd_oauth_handshake():


    consumer_token = ConsumerToken(oauth_config.consumer_key, oauth_config.consumer_secret)

    # Construct handshaker with wiki URI and consumer

    handshaker = Handshaker("https://www.mediawiki.org/w/index.php", consumer_token)
    #
    # Step 1: Initialize -- ask MediaWiki for a temporary key/secret for user
    mw_redirect, request_token = handshaker.initiate()
    return mw_redirect

    # redirect(mw_redirect)
    # Step 2: Authorize -- send user to MediaWiki to confirm authorization
    # print("Point your browser to: %s" % mw_redirect) #
    # response_qs = input("Response query string: ")

    # Step 3: Complete -- obtain authorized key/secret for "resource owner"
    # access_token = handshaker.complete(request_token, response_qs)
    # print(str(access_token))

    # Step 4: Identify -- (optional) get identifying information about the user
    # identity = handshaker.identify(access_token)
    # print("Identified as {username}.".format(**identity))
