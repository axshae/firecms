import React from "react";

import { GoogleAuthProvider } from "firebase/auth";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";

import {
    CircularProgressCenter,
    CMSAppProvider,
    CMSRoutes,
    CMSScaffold,
    createCMSDefaultTheme
} from "../core";
import { AuthController } from "../contexts";
import { EntityLinkBuilder } from "../models";

import { FirebaseCMSAppProps } from "./FirebaseCMSAppProps";
import { useFirebaseAuthController } from "./hooks/useFirebaseAuthController";
import { useFirestoreDataSource } from "./hooks/useFirestoreDataSource";
import { useFirebaseStorageSource } from "./hooks/useFirebaseStorageSource";
import { useInitialiseFirebase } from "./hooks/useInitialiseFirebase";
import FirebaseLoginView from "./components/FirebaseLoginView";
import { EntitySideDialogs } from "../core/internal/EntitySideDialogs";
import { FireCMSLogo } from "../core/components/FireCMSLogo";

const DEFAULT_SIGN_IN_OPTIONS = [
    GoogleAuthProvider.PROVIDER_ID
];

/**
 * Main entry point for FireCMS. You can use this component as a full app,
 * by specifying collections and entity schemas.
 *
 * This component is in charge of initialising Firebase, with the given
 * configuration object.
 *
 * If you are building a larger app and need finer control, you can use
 * {@link CMSAppProvider} and {@link CMSScaffold} instead.
 *
 * @param props
 * @constructor
 * @category Firebase
 */
export function FirebaseCMSApp({
                                   name,
                                   logo,
                                   toolbarExtraWidget,
                                   authentication,
                                   schemaResolver,
                                   navigation,
                                   textSearchController,
                                   allowSkipLogin,
                                   signInOptions,
                                   firebaseConfig,
                                   onFirebaseInit,
                                   primaryColor,
                                   secondaryColor,
                                   fontFamily,
                                   dateTimeFormat,
                                   locale,
                                   HomePage
                               }: FirebaseCMSAppProps) {

    const {
        firebaseApp,
        firebaseConfigLoading,
        configError,
        firebaseConfigError
    } = useInitialiseFirebase({ onFirebaseInit, firebaseConfig });

    const authController: AuthController = useFirebaseAuthController({
        firebaseApp,
        authentication
    });

    if (configError) {
        return <div> {configError} </div>;
    }

    if (firebaseConfigError) {
        return <div>
            It seems like the provided Firebase config is not correct. If you
            are using the credentials provided automatically by Firebase
            Hosting, make sure you link your Firebase app to Firebase
            Hosting.
        </div>;
    }

    if (firebaseConfigLoading || !firebaseApp) {
        return <CircularProgressCenter/>;
    }

    const dataSource = useFirestoreDataSource({
        firebaseApp: firebaseApp,
        textSearchController
    });
    const storageSource = useFirebaseStorageSource({ firebaseApp: firebaseApp });

    const entityLinkBuilder: EntityLinkBuilder = ({ entity }) => `https://console.firebase.google.com/project/${firebaseApp.options.projectId}/firestore/data/${entity.path}/${entity.id}`;

    return (

        <BrowserRouter>
            <CMSAppProvider navigation={navigation}
                            authController={authController}
                            schemaResolver={schemaResolver}
                            dateTimeFormat={dateTimeFormat}
                            dataSource={dataSource}
                            storageSource={storageSource}
                            entityLinkBuilder={entityLinkBuilder}
                            locale={locale}>
                {({ context, mode }) => {

                    const theme = createCMSDefaultTheme({
                        mode: mode,
                        primaryColor,
                        secondaryColor,
                        fontFamily
                    });

                    let component;
                    if (context.authController.authLoading || context.navigationLoading) {
                        component = <CircularProgressCenter/>;
                    } else if (!context.authController.canAccessMainView) {
                        component = (
                            <FirebaseLoginView
                                logo={logo}
                                skipLoginButtonEnabled={allowSkipLogin}
                                signInOptions={signInOptions ?? DEFAULT_SIGN_IN_OPTIONS}
                                firebaseApp={firebaseApp}/>
                        );
                    } else {
                        component = (
                            <CMSScaffold name={name}
                                         logo={logo}
                                         toolbarExtraWidget={toolbarExtraWidget}>
                                <CMSRoutes HomePage={HomePage}/>
                                <EntitySideDialogs/>
                            </CMSScaffold>
                        );
                    }

                    return (
                        <ThemeProvider theme={theme}>
                            <CssBaseline/>
                            {component}
                        </ThemeProvider>
                    );
                }}
            </CMSAppProvider>
        </BrowserRouter>
    );
}
